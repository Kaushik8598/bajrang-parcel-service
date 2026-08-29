/**
 * Code 128 Barcode Generator (Pure TypeScript / SVG)
 * Supports Code Set B (standard ASCII characters 32-126).
 */

const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112", // 100-106
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export interface BarcodeOptions {
  height?: number;
  barWidth?: number;
  quietZone?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
  fontSize?: number;
}

/**
 * Generate Code 128 SVG string for a given text.
 */
export function generateBarcodeSvg(text: string, options: BarcodeOptions = {}): string {
  const {
    height = 50,
    barWidth = 2,
    quietZone = 10,
    color = "#000000",
    backgroundColor = "transparent",
    showText = false,
    fontSize = 12,
  } = options;

  const sanitized = text.replace(/[^\x20-\x7E]/g, "");
  if (!sanitized) return "";

  const codes: number[] = [START_CODE_B];
  let checkSum = START_CODE_B;

  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i) - 32;
    codes.push(code);
    checkSum += code * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(STOP_CODE);

  let patternSequence = "";
  for (const code of codes) {
    patternSequence += CODE128_PATTERNS[code] || "";
  }

  let totalModules = 0;
  for (let i = 0; i < patternSequence.length; i++) {
    totalModules += parseInt(patternSequence[i], 10);
  }

  const svgWidth = totalModules * barWidth + quietZone * 2;
  const svgHeight = height + (showText ? fontSize + 4 : 0);

  let currentX = quietZone;
  let rectsSvg = "";

  for (let i = 0; i < patternSequence.length; i++) {
    const width = parseInt(patternSequence[i], 10) * barWidth;
    const isBar = i % 2 === 0;
    if (isBar) {
      rectsSvg += `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="${color}" />`;
    }
    currentX += width;
  }

  let textSvg = "";
  if (showText) {
    textSvg = `<text x="${svgWidth / 2}" y="${height + fontSize}" font-family="monospace, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" text-anchor="middle">${sanitized}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="${svgHeight}" preserveAspectRatio="xMidYMid meet" style="background:${backgroundColor};display:block;">${rectsSvg}${textSvg}</svg>`;
}
