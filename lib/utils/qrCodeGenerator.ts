/**
 * Pure TypeScript QR Code SVG Generator
 * Generates clean standalone SVG QR Code for strings (URLs, LR numbers, contact details).
 */

// Simple & robust QR Code matrix encoder (Version 1-6 support with ECC-L/M)
class QRBitBuffer {
  buffer: number[] = [];
  length = 0;

  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }
}

// Polynomial & Galois Field math for QR Error Correction
const QRMath = {
  glog(n: number): number {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  },
  gexp(n: number): number {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256),
};

for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

class QRPolynomial {
  num: number[];
  constructor(num: number[], shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
  }

  get(index: number): number {
    return this.num[index];
  }

  getLength(): number {
    return this.num.length;
  }

  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(
          QRMath.glog(this.get(i)) + QRMath.glog(e.get(j))
        );
      }
    }
    return new QRPolynomial(num);
  }

  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num).mod(e);
  }
}

class QRCodeModel {
  typeNumber: number;
  errorCorrectLevel: number;
  modules: (boolean | null)[][] = [];
  moduleCount = 0;
  dataList: string[] = [];

  constructor(typeNumber: number, errorCorrectLevel: number) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
  }

  addData(data: string): void {
    this.dataList.push(data);
  }

  isDark(row: number, col: number): boolean {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      return false;
    }
    return Boolean(this.modules[row][col]);
  }

  make(): void {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(null);
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(false, 0);

    const data = this.createData();
    this.mapData(data, 0);
  }

  setupPositionProbePattern(row: number, col: number): void {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupTimingPattern(): void {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = c % 2 === 0;
    }
  }

  setupPositionAdjustPattern(): void {
    const pos = this.getPatternPosition();
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (
              r === -2 ||
              r === 2 ||
              c === -2 ||
              c === 2 ||
              (r === 0 && c === 0)
            ) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  getPatternPosition(): number[] {
    if (this.typeNumber <= 1) return [];
    if (this.typeNumber === 2) return [6, 18];
    if (this.typeNumber === 3) return [6, 22];
    if (this.typeNumber === 4) return [6, 26];
    if (this.typeNumber === 5) return [6, 30];
    return [6, 34];
  }

  setupTypeInfo(test: boolean, maskPattern: number): void {
    const data = (1 << 3) | maskPattern; // ECC Level L = 1
    const bits = this.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.moduleCount - 15 + i][8] = mod;

      if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
      else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  getBCHTypeInfo(data: number): number {
    let d = data << 10;
    while (this.getBCHDigit(d) - this.getBCHDigit(0x537) >= 0) {
      d ^= 0x537 << (this.getBCHDigit(d) - this.getBCHDigit(0x537));
    }
    return ((data << 10) | d) ^ 0x5412;
  }

  getBCHDigit(data: number): number {
    let digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  }

  createData(): number[] {
    const buffer = new QRBitBuffer();
    // 8-bit byte mode
    for (const text of this.dataList) {
      buffer.put(4, 4); // mode 8-bit
      const utf8Bytes: number[] = [];
      for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        if (code < 128) utf8Bytes.push(code);
        else if (code < 2048) {
          utf8Bytes.push(192 | (code >> 6), 128 | (code & 63));
        } else {
          utf8Bytes.push(
            224 | (code >> 12),
            128 | ((code >> 6) & 63),
            128 | (code & 63)
          );
        }
      }
      buffer.put(utf8Bytes.length, this.typeNumber < 10 ? 8 : 16);
      for (const b of utf8Bytes) {
        buffer.put(b, 8);
      }
    }

    // Total data capacity for Version 1..6 ECC-L
    const totalDataCount = [0, 19, 34, 55, 80, 108, 136][this.typeNumber] || 55;
    if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.length % 8 !== 0) buffer.putBit(false);

    while (buffer.length < totalDataCount * 8) {
      buffer.put(0xec, 8);
      if (buffer.length < totalDataCount * 8) buffer.put(0x11, 8);
    }

    // Generate ECC blocks
    const rsBlocks = [0, 7, 10, 15, 20, 26, 36][this.typeNumber] || 15;
    const rawData = buffer.buffer;
    const rsPoly = this.getErrorCorrectPolynomial(rsBlocks);
    const rawPoly = new QRPolynomial(rawData, rsBlocks);
    const modPoly = rawPoly.mod(rsPoly);

    const eccBytes = new Array(rsBlocks).fill(0);
    for (let i = 0; i < rsBlocks; i++) {
      const modIndex = i + modPoly.getLength() - rsBlocks;
      eccBytes[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
    }

    return [...rawData, ...eccBytes];
  }

  getErrorCorrectPolynomial(errorCorrectLength: number): QRPolynomial {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  }

  mapData(data: number[], maskPattern: number): void {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            const mask = (row + (col - c)) % 2 === 0;
            if (mask) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }
}

export interface QrOptions {
  size?: number;
  color?: string;
  backgroundColor?: string;
  margin?: number;
}

/**
 * Generate a standalone vector SVG QR Code for any text or link.
 */
export function generateQrCodeSvg(text: string, options: QrOptions = {}): string {
  const {
    size = 100,
    color = "#000000",
    backgroundColor = "transparent",
    margin = 1,
  } = options;

  let typeNumber = 2;
  const len = text.length;
  if (len < 14) typeNumber = 1;
  else if (len < 26) typeNumber = 2;
  else if (len < 42) typeNumber = 3;
  else if (len < 62) typeNumber = 4;
  else if (len < 84) typeNumber = 5;
  else typeNumber = 6;

  try {
    const qr = new QRCodeModel(typeNumber, 1);
    qr.addData(text);
    qr.make();

    const count = qr.moduleCount;
    const viewSize = count + margin * 2;
    let path = "";

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          path += `M${c + margin},${r + margin}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="${size}" height="${size}" style="background:${backgroundColor};display:block;"><path d="${path}" fill="${color}" shape-rendering="crispEdges" /></svg>`;
  } catch (err) {
    // Fallback simple square in case of extreme input
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"><rect width="100" height="100" fill="#eee"/><text x="50" y="50" font-size="10" text-anchor="middle">QR</text></svg>`;
  }
}
