/** Reads a uint24 at offset 0 from the buffer. */
const getUint24 = (arrayBuffer: ArrayBuffer, le: boolean) => {
	const buf = new Uint8Array(arrayBuffer);
	return le ? buf[0] | buf[1] << 8 | buf[2] << 16 : buf[0] << 16 | buf[1] << 8 | buf[2];
};

const getFloat16 = (exponentWidth: number, significandPrecision: number) => {
	const exponentMask = (2 ** exponentWidth - 1) << significandPrecision;
	const fractionMask = 2 ** significandPrecision - 1;

	const exponentBias = 2 ** (exponentWidth - 1) - 1;
	const exponentMin = 1 - exponentBias;

	return (arrayBuffer: ArrayBuffer, le: boolean) => {
		const buf = new Uint8Array(arrayBuffer);
		const uint16 = le ? buf[0] | buf[1] << 8 : buf[0] << 8 | buf[1];

		const e = (uint16 & exponentMask) >> significandPrecision;
		const f = uint16 & fractionMask;
		const sign = uint16 >> 15 ? -1 : 1;

		if (e === 0) {
			return sign * (2 ** exponentMin) * (f / (2 ** significandPrecision));
		} else if (e === (2 ** exponentWidth - 1)) {
			return f ? NaN : sign * Infinity;
		}

		return sign * (2 ** (e - exponentBias)) * (1 + (f / (2 ** significandPrecision)));
	};
};

export interface IInspectableType {
	/** Readable label for the type */
	label: string;
	/** Minimum number of bytes needed to accurate disable this type */
	minBytes: number;
	/** Shows the representation of the type from the data view */
	convert(dv: DataView, littleEndian: boolean): string;
}

export const inspectableTypes: readonly IInspectableType[] = [
	{ label: "binary", minBytes: 1, convert: dv => dv.getUint8(0).toString(2).padStart(8, "0") },

	{ label: "octal", minBytes: 1, convert: dv => dv.getUint8(0).toString(8).padStart(3, "0") },

	{ label: "uint8", minBytes: 1, convert: dv => dv.getUint8(0).toString() },
	{ label: "int8", minBytes: 1, convert: dv => dv.getInt8(0).toString() },

	{ label: "uint16", minBytes: 2, convert: (dv, le) => dv.getUint16(0, le).toString() },
	{ label: "int16", minBytes: 2, convert: (dv, le) => dv.getInt16(0, le).toString() },

	{ label: "uint24", minBytes: 3, convert: (dv, le) => getUint24(dv.buffer, le).toString() },
	{
		label: "int24",
		minBytes: 3,
		convert: (dv, le) => {
			const uint = getUint24(dv.buffer, le);
			const isNegative = !!(uint & 0x800000);
			return String(isNegative ? -(0xffffff - uint + 1) : uint);
		}
	},

	{ label: "uint32", minBytes: 4, convert: (dv, le) => dv.getUint32(0, le).toString() },
	{ label: "int32", minBytes: 4, convert: (dv, le) => dv.getInt32(0, le).toString() },

	{ label: "int64", minBytes: 8, convert: (dv, le) => dv.getBigInt64(0, le).toString() },
	{ label: "uint64", minBytes: 8, convert: (dv, le) => dv.getBigUint64(0, le).toString() },

	{ label: "float16", minBytes: 2, convert: (dv, le) => getFloat16(5, 10)(dv.buffer, le).toString() },
	{ label: "bfloat16", minBytes: 2, convert: (dv, le) => getFloat16(8, 7)(dv.buffer, le).toString() },

	{ label: "float32", minBytes: 4, convert: (dv, le) => dv.getFloat32(0, le).toString() },
	{ label: "float64", minBytes: 8, convert: (dv, le) => dv.getFloat64(0, le).toString() },

	{
		label: "UTF-8",
		minBytes: 1,
		convert: dv => {
			const utf8 = new TextDecoder("utf-8").decode(dv.buffer);
			for (const char of utf8) return char;
			return utf8;
		},
	},
	{
		label: "UTF-16",
		minBytes: 2,
		convert: (dv, le) => {
			const utf16 = new TextDecoder(le ? "utf-16le" : "utf-16be").decode(dv.buffer);
			for (const char of utf16) return char;
			return utf16;
		},
	},
	{
		label: "Pokemon Char",
		minBytes: 1,
		convert: dv => {
			const map = new Map([
				// Control Characters
				["00", "\0"],
				["4A", "PKMN"],
				["52", "[Player Name]"],
				["53", "[Rival Name]"],
				["54", "POKé"],
				["56", "……"],
				["5B", "PC"],
				["5C", "TM"],
				["5D", "TRAINER"],
				["5E", "ROCKET"],

				// Normal Characters
				["7F", " "],
				["80", "A"],
				["81", "B"],
				["82", "C"],
				["83", "D"],
				["84", "E"],
				["85", "F"],
				["86", "G"],
				["87", "H"],
				["88", "I"],
				["89", "J"],
				["8a", "K"],
				["8b", "L"],
				["8c", "M"],
				["8d", "N"],
				["8e", "O"],
				["8f", "P"],
				["90", "Q"],
				["91", "R"],
				["92", "S"],
				["93", "T"],
				["94", "U"],
				["95", "V"],
				["96", "W"],
				["97", "X"],
				["98", "Y"],
				["99", "Z"],
				["9A", "("],
				["9B", ")"],
				["9C", ":"],
				["9D", ";"],
				["9E", "["],
				["9F", "]"],
				["80", "A"],
				["A1", "B"],
				["A2", "C"],
				["A3", "D"],
				["A4", "E"],
				["A5", "F"],
				["A6", "G"],
				["A7", "H"],
				["A8", "I"],
				["A9", "J"],
				["AA", "K"],
				["AB", "L"],
				["AC", "M"],
				["AD", "N"],
				["AE", "O"],
				["AF", "P"],
				["B0", "Q"],
				["B1", "R"],
				["B2", "S"],
				["B3", "T"],
				["B4", "U"],
				["B5", "V"],
				["B6", "W"],
				["B7", "X"],
				["B8", "Y"],
				["B9", "Z"],
				["BA", "é"],
				["BB", "'d"],
				["BC", "'l"],
				["BD", "'s"],
				["BE", "'t"],
				["BF", "'v"],
				["E0", "'"],
				["E1", "PK"],
				["E2", "MN"],
				["E3", "-"],
				["E4", "'r"],
				["E5", "'m"],
				["E6", "?"],
				["E7", "!"],
				["E8", "."],
				["EC", "▷"],
				["ED", "▶"],
				["EE", "▼"],
				["EF", "♂"],
				["F0", "$"],
				["F1", "♂"],
				["F2", "×"],
				["F3", "."],
				["F4", "/"],
				["F5", ","],
				["F6", "♀"],
				["F7", "0"],
				["F8", "1"],
				["F8", "2"],
				["F9", "3"],
				["FA", "4"],
				["FB", "5"],
				["FC", "6"],
				["FD", "7"],
				["FE", "8"],
				["FF", "9"],
			]);

			const char = map.get(dv.getUint8(0).toString(16).toUpperCase());

			return char ? char : "";
		}
	},
];
