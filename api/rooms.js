// api/room-store.ts
import { randomBytes } from "node:crypto";

// api/word-bank.ts
var wordBank = {
  "\u0110\u1ED3 v\u1EADt & \u0110\u1EDDi th\u01B0\u1EDDng": [
    "B\xE0n ch\u1EA3i \u0111\xE1nh r\u0103ng",
    "M\u1EA5t ch\xECa kh\xF3a",
    "M\xE1y gi\u1EB7t c\u1EEDa ngang",
    "\u0110i ch\u1EE3 B\u1EBFn Th\xE0nh",
    "Ng\u1EE7 n\u01B0\u1EDBng",
    "B\xE1nh m\xEC k\u1EB9p th\u1ECBt",
    "Thang m\xE1y m\u1EA5t \u0111i\u1EC7n",
    "\u0110i\u1EC7n tho\u1EA1i h\u1EBFt pin",
    "\xC1o m\u01B0a r\xE1ch",
    "N\u1ED3i c\u01A1m \u0111i\u1EC7n",
    "H\u1EAFt x\xEC h\u01A1i",
    "K\u1EB9t xe ng\xE3 t\u01B0",
    "\u0110\u1ED3ng h\u1ED3 b\xE1o th\u1EE9c",
    "D\xE9p t\u1ED5 ong",
    "\u0110\xE8n giao th\xF4ng",
    "T\u1EE7 l\u1EA1nh mini",
    "H\xE1t Karaoke",
    "G\u1ED9i \u0111\u1EA7u d\u01B0\u1EE1ng sinh",
    "C\u1EAFt t\xF3c moi",
    "Qu\xE9t nh\xE0",
    "R\u1EEDa b\xE1t \u0111\u0129a",
    "N\u1ED3i chi\xEAn kh\xF4ng d\u1EA7u",
    "C\xE2y lau nh\xE0",
    "B\xECnh gi\u1EEF nhi\u1EC7t",
    "\xD4 che m\u01B0a",
    "S\u1EA1c d\u1EF1 ph\xF2ng",
    "Tai nghe kh\xF4ng d\xE2y",
    "Qu\u1EA1t tr\u1EA7n rung l\u1EAFc",
    "C\xE1i b\u1EA5m m\xF3ng tay",
    "K\xEDnh r\xE2m th\u1EDDi trang",
    "B\xE0n \u1EE7i qu\u1EA7n \xE1o",
    "B\xECnh n\xF3ng l\u1EA1nh",
    "B\xE0n ph\xEDm c\u01A1",
    "Chu\u1ED9t m\xE1y t\xEDnh",
    "M\xE0n h\xECnh cong",
    "Tivi th\xF4ng minh",
    "M\xE1y s\u1EA5y t\xF3c",
    "L\u01B0\u1EE3c ch\u1EA3i \u0111\u1EA7u",
    "G\u01B0\u01A1ng soi m\u1EB7t",
    "Kem \u0111\xE1nh r\u0103ng",
    "X\xE0 ph\xF2ng b\xE1nh",
    "Kh\u0103n t\u1EAFm to",
    "B\u1ED3n c\u1EA7u th\xF4ng minh",
    "Gi\u1EA5y v\u1EC7 sinh",
    "Th\xF9ng r\xE1c c\xF4ng c\u1ED9ng",
    "Ch\u1ED5i qu\xE9t nh\xE0",
    "\u0110\u1ED3 h\xF3t r\xE1c",
    "C\xE1i x\xF4 n\u01B0\u1EDBc",
    "G\u0103ng tay cao su",
    "M\xF3c treo qu\u1EA7n \xE1o",
    "B\xE0n h\u1ECDc sinh",
    "Gh\u1EBF c\xF4ng th\xE1i h\u1ECDc",
    "\u0110\xE8n b\xE0n h\u1ECDc",
    "B\xFAt bi t\u1EAFc m\u1EF1c",
    "B\xFAt ch\xEC b\u1EA5m",
    "C\u1EE5c t\u1EA9y ch\xEC",
    "Th\u01B0\u1EDBc k\u1EBB nh\u1EF1a",
    "H\u1ED9p b\xFAt m\xE0u",
    "C\u1EB7p s\xE1ch h\u1ECDc sinh",
    "S\u1ED5 tay ghi ch\xE9p",
    "Balo du l\u1ECBch",
    "Vali k\xE9o",
    "V\xED ti\u1EC1n r\u1ED7ng",
    "C\u0103n c\u01B0\u1EDBc c\xF4ng d\xE2n",
    "Th\u1EBB ng\xE2n h\xE0ng",
    "Ch\xECa kh\xF3a xe m\xE1y",
    "M\u0169 b\u1EA3o hi\u1EC3m",
    "\xC1o ch\u1ED1ng n\u1EAFng",
    "Kh\u1EA9u trang y t\u1EBF",
    "\u0110\xF4i gi\xE0y th\u1EC3 thao",
    "D\xE9p x\u1ECF ng\xF3n",
    "\u0110\xF4i t\u1EA5t r\xE1ch ng\xF3n",
    "Th\u1EAFt l\u01B0ng da",
    "C\xE0 v\u1EA1t xanh",
    "\u0110\u1ED3ng h\u1ED3 \u0111eo tay",
    "Nh\u1EABn v\xE0ng 9999",
    "D\xE2y chuy\u1EC1n b\u1EA1c",
    "B\xF4ng tai l\u1EA5p l\xE1nh",
    "V\xF2ng tay phong th\u1EE7y",
    "K\u1EB9p t\xF3c c\xE0ng cua",
    "Son m\xF4i \u0111\u1ECF",
    "Ph\u1EA5n trang \u0111i\u1EC3m",
    "B\u1EA5m mi cong",
    "N\u01B0\u1EDBc hoa th\u01A1m l\u1EEBng",
    "Kem ch\u1ED1ng n\u1EAFng",
    "S\u1EEFa r\u1EEDa m\u1EB7t",
    "K\xE9o c\u1EAFt gi\u1EA5y",
    "Dao g\u1ECDt hoa qu\u1EA3",
    "Th\u1EDBt g\u1ED7 nghi\u1EBFn",
    "Ch\u1EA3o ch\u1ED1ng d\xEDnh",
    "N\u1ED3i l\u1EA9u \u0111i\u1EC7n",
    "B\xE1t t\xF4 canh",
    "\u0110\xF4i \u0111\u0169a mun",
    "Th\xECa inox",
    "C\xE1i d\u0129a \u0103n hoa qu\u1EA3",
    "C\u1ED1c th\u1EE7y tinh",
    "B\xECnh l\u1ECDc n\u01B0\u1EDBc",
    "\u1EA4m \u0111un si\xEAu t\u1ED1c",
    "C\xE1i m\u1EDF n\u1EAFp chai",
    "B\u1EADt l\u1EEDa gas",
    "H\u1ED9p qu\u1EB9t di\xEAm",
    "B\xECnh c\u1EE9u h\u1ECFa",
    "B\xF3ng \u0111\xE8n tr\xF2n",
    "\u1ED4 c\u1EAFm \u0111i\u1EC7n l\u1ECFng",
    "D\xE2y th\u1EEBng gai",
    "C\xE1i thang nh\xF4m",
    "C\xE1i b\xFAa \u0111inh",
    "K\xECm b\u1EA5m d\xE2y",
    "Tua v\xEDt 4 c\u1EA1nh",
    "C\u1EDD l\xEA m\u1ECF l\u1EBFt",
    "Th\u01B0\u1EDBc cu\u1ED9n th\xE9p",
    "M\xE1y khoan b\xEA t\xF4ng",
    "C\u01B0a g\u1ED7 c\u1EA7m tay",
    "H\u1ED9p s\u01A1n t\u01B0\u1EDDng",
    "C\xE2y l\u0103n s\u01A1n"
  ],
  "\u1EA8m th\u1EF1c & M\xF3n ngon": [
    "Ph\u1EDF b\xF2 t\xE1i n\u1EA1m",
    "Tr\xE0 s\u1EEFa tr\xE2n ch\xE2u \u0111\u01B0\u1EDDng \u0111en",
    "B\xE1nh x\xE8o gi\xF2n r\u1EE5m",
    "Kem \u1ED1c qu\u1EBF s\xF4 c\xF4 la",
    "G\u1ECFi cu\u1ED1n t\xF4m th\u1ECBt",
    "Sushi c\xE1 h\u1ED3i",
    "N\u01B0\u1EDBc d\u1EEBa t\u01B0\u01A1i xi\xEAm",
    "B\u1EAFp rang b\u01A1 r\u1EA1p phim",
    "M\xEC cay 7 c\u1EA5p \u0111\u1ED9",
    "B\xE1nh ch\u01B0ng ng\xE0y T\u1EBFt",
    "C\xE0 ph\xEA s\u1EEFa \u0111\xE1 S\xE0i G\xF2n",
    "Ch\xE2n g\xE0 s\u1EA3 t\u1EAFc",
    "Pizza h\u1EA3i s\u1EA3n ph\xF4 mai",
    "Ch\xE8 \u0111\u1EADu xanh n\u01B0\u1EDBc c\u1ED1t d\u1EEBa",
    "B\xFAn \u0111\u1EADu m\u1EAFm t\xF4m",
    "B\xFAn b\xF2 Hu\u1EBF cay n\u1ED3ng",
    "C\u01A1m t\u1EA5m s\u01B0\u1EDDn b\xEC ch\u1EA3",
    "B\xE1nh tr\xE1ng n\u01B0\u1EDBng \u0110\xE0 L\u1EA1t",
    "H\u1ED9t v\u1ECBt l\u1ED9n lu\u1ED9c",
    "Nem r\xE1n H\xE0 N\u1ED9i",
    "B\xE1nh cu\u1ED1n n\xF3ng r\u1EAFc h\xE0nh phi",
    "X\xF4i x\xE9o \u0111\u1EADu xanh",
    "Ch\xE8 b\u01B0\u1EDFi An Giang",
    "Tr\xE0 \u0111\xE0o cam s\u1EA3",
    "B\xE1nh b\u1ED9t l\u1ECDc Hu\u1EBF",
    "B\xF2 b\xEDa ng\u1ECDt tu\u1ED5i th\u01A1",
    "C\xFAt l\u1ED9n x\xE0o me chua ng\u1ECDt",
    "\u1ED0c h\u01B0\u01A1ng s\u1ED1t tr\u1EE9ng mu\u1ED1i",
    "B\xE1nh bao nh\xE2n th\u1ECBt tr\u1EE9ng c\xFAt",
    "B\xE1nh ti\xEAu \u0111\u01B0\u1EDDng",
    "B\xE1nh da l\u1EE3n",
    "B\xE1nh r\xE1n v\u1EEBng m\u1EADt",
    "Ch\xE8 kh\xFAc b\u1EA1ch",
    "T\xE0o ph\u1EDB \u0111\u01B0\u1EDDng th\u1ED1t n\u1ED1t",
    "Tr\xE0 chanh ch\xE9m gi\xF3",
    "N\u01B0\u1EDBc m\xEDa tr\xE2n ch\xE2u",
    "N\u01B0\u1EDBc \xE9p d\u01B0a h\u1EA5u",
    "Sinh t\u1ED1 b\u01A1 s\u1EA7u ri\xEAng",
    "C\xE0 ph\xEA tr\u1EE9ng H\xE0 N\u1ED9i",
    "S\u1EEFa chua d\u1EBBo",
    "B\xE1nh m\xEC k\u1EB9p pate cay",
    "B\xE1nh m\xEC ch\u1EA3o x\xFAc x\xEDch",
    "B\xE1nh canh cua",
    "B\xE1nh \u0111a cua H\u1EA3i Ph\xF2ng",
    "M\xEC Qu\u1EA3ng \u1EBFch",
    "H\u1EE7 ti\u1EBFu Nam Vang",
    "C\u01A1m rang d\u01B0a b\xF2",
    "C\u01A1m chi\xEAn c\xE1 m\u1EB7n",
    "C\u01A1m ni\xEAu \u0111\u1EADp",
    "C\u01A1m lam n\u01B0\u1EDBng \u1ED1ng tre",
    "L\u1EA9u th\xE1i chua cay",
    "L\u1EA9u ri\xEAu cua b\u1EAFp b\xF2",
    "Th\u1ECBt kho h\u1ED9t v\u1ECBt",
    "C\xE1 l\xF3c kho t\u1ED9",
    "Canh chua c\xE1 l\xF3c",
    "Rau mu\u1ED1ng x\xE0o t\u1ECFi",
    "Th\u1ECBt b\xF2 x\xE0o hoa thi\xEAn l\xFD",
    "G\xE0 n\u01B0\u1EDBng mu\u1ED1i \u1EDBt",
    "G\xE0 \u1EE7 mu\u1ED1i hoa ti\xEAu",
    "V\u1ECBt quay B\u1EAFc Kinh",
    "B\xF2 s\u1ED1t vang ch\u1EA5m b\xE1nh m\xEC",
    "B\xF2 n\xE9 b\xE1nh m\xEC",
    "M\u1EF1c x\xE0o c\u1EA7n t\u1ECFi",
    "T\xF4m n\u01B0\u1EDBng mu\u1ED1i \u1EDBt",
    "Cua h\u1EA5p bia s\u1EA3",
    "Gh\u1EB9 xanh lu\u1ED9c",
    "B\u1EA1ch tu\u1ED9c n\u01B0\u1EDBng sa t\u1EBF",
    "H\xE0u n\u01B0\u1EDBng m\u1EE1 h\xE0nh",
    "Ngh\xEAu h\u1EA5p s\u1EA3 \u1EDBt",
    "S\xFAp cua m\u0103ng t\xE2y",
    "B\xE1nh m\xEC n\u01B0\u1EDBng b\u01A1 t\u1ECFi",
    "Khoai t\xE2y chi\xEAn gi\xF2n",
    "G\xE0 r\xE1n gi\xF2n tan",
    "B\xE1nh hamburger b\xF2",
    "B\xE1nh m\xEC Doner Kebab",
    "M\xEC \xDD s\u1ED1t b\xF2 b\u0103m",
    "B\xE1nh su s\xEA phu th\xEA",
    "B\xE1nh p\xEDa S\xF3c Tr\u0103ng",
    "B\xE1nh \u0111\u1EADu xanh H\u1EA3i D\u01B0\u01A1ng",
    "B\xE1nh c\u1ED1m L\xE0ng V\xF2ng"
  ],
  "\u0110\u1ED9ng v\u1EADt & Sinh v\u1EADt": [
    "Con l\u01B0\u1EDDi l\u01B0\u1EDDi bi\u1EBFng",
    "Chim c\xE1nh c\u1EE5t Nam C\u1EF1c",
    "H\u01B0\u01A1u cao c\u1ED5 \u0111\u1ED1m",
    "Kangaroo chu\u1ED9t t\xFAi",
    "C\xE1 heo th\xF4ng minh nh\u1EA3y m\xFAa",
    "T\u1EAFc k\xE8 hoa \u0111\u1ED5i m\xE0u",
    "G\u1EA5u tr\xFAc \u0103n l\xE1 tre",
    "Con nh\xEDm x\xF9 l\xF4ng nh\u1ECDn",
    "C\xFA m\xE8o th\u1EE9c \u0111\xEAm",
    "Con c\xF4ng x\xF2e \u0111u\xF4i r\u1EF1c r\u1EE1",
    "Con m\xE8o tam th\u1EC3 b\u1EAFt chu\u1ED9t",
    "Con ch\xF3 corgi m\xF4ng to",
    "Chu\u1ED9t \u0111\u1ED3ng g\u1EB7m l\xFAa",
    "Con voi phun n\u01B0\u1EDBc v\xF2i",
    "H\u1ED5 v\u1EB1n g\u1EA7m vang r\u1EEBng",
    "S\u01B0 t\u1EED b\u1EDDm r\u1EADm",
    "B\xE1o hoa mai leo c\xE2y",
    "G\u1EA5u b\u1EAFc c\u1EF1c tr\u1EAFng mu\u1ED1t",
    "Kh\u1EC9 \u0111\u1ED9t \u0111u c\xE2y",
    "V\u01B0\u1EE3n h\xFA vang r\u1EEBng",
    "S\xF3c \u0111\u1ECF \u0103n h\u1EA1t d\u1EBB",
    "Con chu\u1ED9t t\xFAi t\xFAi to",
    "L\u1EA1c \u0111\xE0 hai b\u01B0\u1EDBu tr\xEAn c\xE1t",
    "Ng\u1EF1a v\u1EB1n ch\xE2u Phi",
    "T\xEA gi\xE1c m\u1ED9t s\u1EEBng",
    "H\xE0 m\xE3 h\xE1 mi\u1EC7ng to",
    "C\xE1 s\u1EA5u \u0111\u1EA7m l\u1EA7y",
    "R\xF9a bi\u1EC3n kh\u1ED5ng l\u1ED3",
    "K\u1EF3 nh\xF4ng c\xE1t",
    "Th\u1EB1n l\u1EB1n b\xE1m t\u01B0\u1EDDng",
    "R\u1EAFn h\u1ED5 mang b\xE0nh mang",
    "Tr\u0103n g\u1EA5m kh\u1ED5ng l\u1ED3",
    "Con \u1EBFch ng\u1ED3i \u0111\xE1y gi\u1EBFng",
    "Con c\xF3c nghi\u1EBFn r\u0103ng tr\u1EDDi m\u01B0a",
    "Con giun \u0111\u1EA5t \u0111\xE0o h\u1ED1",
    "\u0110\u1EA1i b\xE0ng s\u0103n m\u1ED3i tung c\xE1nh",
    "Chim \u01B0ng m\u1EAFt s\u1EAFc",
    "Chim b\u1ED3 c\xE2u tr\u1EAFng h\xF2a b\xECnh",
    "Chim b\xF3i c\xE1 lao b\u1EAFt m\u1ED3i",
    "V\u1EB9t xanh bi\u1EBFt n\xF3i ti\u1EBFng ng\u01B0\u1EDDi",
    "Chim s\u1EBB bay chuy\u1EC1n",
    "Chim g\xF5 ki\u1EBFn m\u1ED5 c\xE2y",
    "Con c\xF2 bay l\u1EA3 bay la",
    "Thi\xEAn nga b\u01A1i tr\xEAn h\u1ED3",
    "\u0110\xE0 \u0111i\u1EC3u ch\u1EA1y \u0111ua tr\xEAn c\xE1t",
    "C\xE1 m\u1EADp tr\u1EAFng s\xE1t th\u1EE7",
    "C\xE1 voi xanh kh\u1ED5ng l\u1ED3",
    "C\xE1 ng\u1EF1a \u0111\u1EF1c mang b\u1EA7u",
    "B\u1EA1ch tu\u1ED9c kh\u1ED5ng l\u1ED3 phun m\u1EF1c",
    "M\u1EF1c nang b\u01A1i l\xF9i",
    "Con s\u1EE9a bi\u1EC3n ph\xE1t s\xE1ng",
    "Sao bi\u1EC3n n\u0103m c\xE1nh",
    "Cua ho\xE0ng \u0111\u1EBF Alaska",
    "T\xF4m h\xF9m bi\u1EC3n to l\u1EDBn",
    "San h\xF4 \u0111\u1ECF d\u01B0\u1EDBi \u0111\u1EA1i d\u01B0\u01A1ng",
    "Con ong ch\u0103m ch\u1EC9 h\xFAt m\u1EADt",
    "B\u01B0\u1EDBm s\u1EB7c s\u1EE1 bay l\u01B0\u1EE3n",
    "Chu\u1ED3n chu\u1ED3n c\u1EAFn r\u1ED1n t\u1EADp b\u01A1i",
    "B\u1ECD ng\u1EF1a m\xFAa v\xF5 ki\u1EBFm",
    "B\u1ECD hung l\u0103n ph\xE2n tr\xF2n",
    "Con ki\u1EBFn ch\u0103m ch\u1EC9 tha m\u1ED3i",
    "Ve s\u1EA7u k\xEAu h\xE8",
    "\u0110om \u0111\xF3m l\u1EADp l\xF2e \u0111\xEAm h\xE8",
    "Con mu\u1ED7i h\xFAt m\xE1u ng\u1EE9a",
    "Con ru\u1ED3i \u0111\u1EADu m\xE2m c\u01A1m"
  ],
  "H\xE0nh \u0111\u1ED9ng & Ngh\u1EC1 nghi\u1EC7p": [
    "Tr\u01B0\u1EE3t v\u1ECF chu\u1ED1i ng\xE3 d\u1EADp m\xF4ng",
    "Nh\u1EA3y d\xE2y \u0111\xF4i nh\u1ECBp nh\xE0ng",
    "B\u01A1i ng\u1EEDa th\u01B0 gi\xE3n h\u1ED3 b\u01A1i",
    "Ch\u1EE5p \u1EA3nh t\u1EF1 s\u01B0\u1EDBng selfie",
    "\u0110\xE1nh r\u0103ng s\xE1ng s\u1EDBm",
    "Th\u1ED5i n\u1EBFn b\xE1nh sinh nh\u1EADt",
    "\u0110\xE0o khoai lang b\xE3i c\xE1t",
    "Ch\u1EA1y marathon to\xE1t m\u1ED3 h\xF4i",
    "\u0110\u1EA1p xe v\u01B0\u1EE3t d\u1ED1c leo \u0111\xE8o",
    "T\u1EADp yoga tr\u1ED3ng c\xE2y chu\u1ED1i",
    "C\xE2u c\xE1 d\u01B0\u1EDBi c\u01A1n m\u01B0a r\xE0o",
    "G\xF3i h\u1ED9p qu\xE0 th\u1EAFt n\u01A1 \u0111\u1ECF",
    "\u0110\xE1nh \u0111\xE0n guitar h\xE1t ngh\xEAu ngao",
    "Ng\xE1p ng\u1EE7 ch\u1EA3y n\u01B0\u1EDBc m\u1EAFt",
    "Th\u1EA3 di\u1EC1u no gi\xF3 tr\xEAn \u0111\xEA",
    "B\u1EAFn tim ng\xF3n tay ki\u1EC3u H\xE0n Qu\u1ED1c",
    "Ngo\xE1y m\u0169i l\xE9n l\xFAt b\u1ECB b\u1EAFt qu\u1EA3 tang",
    "M\xFAa qu\u1EA1t \u0111i\xEAu luy\u1EC7n ki\u1EC3u Kh\xE1 B\u1EA3nh",
    "Ch\xE8o thuy\u1EC1n kayak v\u01B0\u1EE3t th\xE1c",
    "V\u1EAFt chanh b\u1ECF v\u1ECF ph\u0169 ph\xE0ng",
    "Tung h\u1EE9ng ba qu\u1EA3 b\xF3ng tennis",
    "Nh\u1EA3y hiphop quay \u0111\u1EA7u \u0111\u1EA5t",
    "T\u1EADp gym \u0111\u1EA9y t\u1EA1 \u0111\xF2n n\u1EB7ng",
    "\u0110\u1EAFp m\u1EB7t n\u1EA1 d\u01B0a leo n\u1EB1m ng\u1EE7",
    "H\xEDt x\xE0 \u0111\u01A1n g\u1ED3ng c\u01A1 b\u1EE5ng",
    "L\u1EAFc v\xF2ng eo thon tr\xEAn s\xE0n",
    "L\u1EA5y r\xE1y tai lim dim m\u1EAFt",
    "Nh\xF3n g\xF3t \u0111i r\xF3n r\xE9n ban \u0111\xEAm",
    "B\u1EAFt tay k\xFD h\u1EE3p \u0111\u1ED3ng",
    "H\xE1t rap ng\u1EA7u l\xF2i b\u1EAFn ch\u1EEF lia l\u1ECBa",
    "B\xE1c s\u0129 ph\u1EABu thu\u1EADt c\u1EE9u ng\u01B0\u1EDDi",
    "C\u1EA3nh s\xE1t giao th\xF4ng th\u1ED5i c\xF2i",
    "L\xEDnh c\u1EE9u h\u1ECFa x\u1ECBt v\xF2i r\u1ED3ng",
    "Th\u1EE3 x\xE2y tr\xE1t v\u1EEFa x\xE2y t\u01B0\u1EDDng",
    "\u0110\u1EA7u b\u1EBFp tung ch\u1EA3o l\u1EEDa b\u1ED1c",
    "Phi c\xF4ng l\xE1i m\xE1y bay d\xE2n d\u1EE5ng",
    "Ti\u1EBFp vi\xEAn h\xE0ng kh\xF4ng c\xFAi ch\xE0o",
    "N\xF4ng d\xE2n c\u1EA5y l\xFAa g\u1EADp l\u01B0ng",
    "Ng\u01B0 d\xE2n k\xE9o l\u01B0\u1EDBi \u0111\xE1nh c\xE1",
    "Th\u1EE3 m\u1ED9c b\xE0o g\u1ED7 m\xF9n c\u01B0a bay",
    "Th\u1EE3 may \u0111o \xE1o d\xE0i truy\u1EC1n th\u1ED1ng",
    "Th\u1EE3 s\u1EEDa xe v\xE1 x\u0103m l\u1ED1p",
    "H\u1ECDa s\u0129 v\u1EBD tranh ch\xE2n dung",
    "Nhi\u1EBFp \u1EA3nh gia ng\u1EAFm m\xE1y \u1EA3nh",
    "Ca s\u0129 c\u1EA7m mic phi\xEAu tr\xEAn s\xE2n kh\u1EA5u",
    "V\u0169 c\xF4ng m\xFAa ba l\xEA ki\u1EC5ng ch\xE2n",
    "\u1EA2o thu\u1EADt gia r\xFAt chim b\u1ED3 c\xE2u",
    "L\u1EADp tr\xECnh vi\xEAn g\xF5 b\xE0n ph\xEDm th\xE2u \u0111\xEAm",
    "Shipper \u0111\u1ED9i n\u1EAFng giao h\xE0ng",
    "B\u1EA3o v\u1EC7 g\xF5 k\u1EBBng tr\u1EF1c \u0111\xEAm"
  ],
  "Nh\xE2n v\u1EADt & Ho\u1EA1t h\xECnh": [
    "Ng\u01B0\u1EDDi Nh\u1EC7n Spider Man \u0111u t\u01A1",
    "N\xE0ng ti\xEAn c\xE1 b\u01A1i \u0111\u1EA1i d\u01B0\u01A1ng",
    "Vua S\u01B0 T\u1EED Simba g\u1EA7m tr\xEAn \u0111\xE1",
    "Harry Potter c\u01B0\u1EE1i ch\u1ED5i b\u1EAFt tr\xE1i b\xF3ng v\xE0ng",
    "Doraemon m\xF3c t\xFAi th\u1EA7n k\u1EF3",
    "Kh\u1EE7ng long b\u1EA1o ch\xFAa T-Rex",
    "Si\xEAu nh\xE2n Gao \u0111\u1ECF bi\u1EBFn h\xECnh",
    "C\xF4ng ch\xFAa t\xF3c m\xE2y Rapunzel",
    "Batman Ng\u01B0\u1EDDi D\u01A1i \u0111\u1EE9ng n\xF3c nh\xE0",
    "Minions chu\u1ED1i v\xE0ng c\u01B0\u1EDDi h\xF4 h\u1ED1",
    "Th\xE1m t\u1EED l\u1EEBng danh Conan ch\u0129a kim g\xE2y m\xEA",
    "Phi h\xE0nh gia c\u1EAFm c\u1EDD m\u1EB7t tr\u0103ng",
    "Ma c\xE0 r\u1ED3ng r\u0103ng nanh s\u1EE3 t\u1ECFi",
    "R\u1ED3ng l\u1EEDa phun b\xE3o l\u1EEDa",
    "Songoku h\xF3a Super Saiyan t\xF3c v\xE0ng",
    "Shin C\u1EADu b\xE9 b\xFAt ch\xEC l\u1EAFc m\xF4ng",
    "Chu\u1ED9t Mickey \u0111eo g\u0103ng tay tr\u1EAFng",
    "Tom \u0111u\u1ED5i b\u1EAFt Jerry b\u1EC3 \u0111\u0129a",
    "G\u1EA5u Pooh m\xEA h\u0169 m\u1EADt ong",
    "N\u1EEF ho\xE0ng b\u0103ng gi\xE1 Elsa \u0111\xF3ng b\u0103ng v\u1EA1n v\u1EADt",
    "Ninja R\xF9a \u0103n pizza c\u1EA7m ki\u1EBFm",
    "Hulk kh\u1ED5ng l\u1ED3 xanh \u0111\u1EADp ph\xE1",
    "Iron Man Ng\u01B0\u1EDDi S\u1EAFt b\u1EAFn tia n\u0103ng l\u01B0\u1EE3ng",
    "Th\u1EA7n s\u1EA5m Thor gi\xE1ng b\xFAa s\xE9t",
    "T\xF4n Ng\u1ED9 Kh\xF4ng m\xFAa g\u1EADy Nh\u01B0 \xDD",
    "Tr\u01B0 B\xE1t Gi\u1EDBi v\xE1c b\u1ED3 c\xE0o m\xEA g\xE1i",
    "B\u1EA1ch Tuy\u1EBFt c\u1EAFn t\xE1o \u0111\u1ED9c ng\u1EE7 say",
    "Aladdin c\u01B0\u1EE1i th\u1EA3m bay th\u1EA7n",
    "Pikachu ph\xF3ng \u0111i\u1EC7n m\u01B0\u1EDDi v\u1EA1n v\xF4n",
    "Naruto ph\xE2n th\xE2n chi thu\u1EADt",
    "Th\u1EE7y th\u1EE7 M\u1EB7t Tr\u0103ng thay m\u1EB7t m\u1EB7t tr\u0103ng tr\u1EEBng tr\u1ECB",
    "M\xE8o m\xE1y \u0110\xF4r\xEAmon \u0103n b\xE1nh r\xE1n",
    "Nobita b\u1EAFn s\xFAng ng\u1EE7 g\u1EADt",
    "Chaien h\xE1t h\u1ECFng m\xE0ng nh\u0129",
    "Xuka t\u1EAFm b\u1ED3n hoa",
    "Shrek ch\u1EB1n tinh m\xE0u xanh t\u1ED1t b\u1EE5ng",
    "B\xE1o H\u1ED3ng Pink Panther l\xE9n l\xFAt",
    "Ch\xFA g\u1EA5u tr\xFAc Kungfu Panda m\u1EADp \xFA",
    "C\xE1 h\u1EC1 Nemo t\xECm \u0111\u01B0\u1EDDng v\u1EC1 nh\xE0",
    "Wall-E robot d\u1ECDn r\xE1c c\xF4 \u0111\u01A1n"
  ],
  "Ca dao & Trend m\u1EA1ng": [
    "\u0102n qu\u1EA3 nh\u1EDB k\u1EBB tr\u1ED3ng c\xE2y",
    "U\u1ED1ng n\u01B0\u1EDBc nh\u1EDB ngu\u1ED3n \u01A1n ngh\u0129a",
    "C\xF3 c\xF4ng m\xE0i s\u1EAFt c\xF3 ng\xE0y n\xEAn kim",
    "M\xE8o khen m\xE8o d\xE0i \u0111u\xF4i t\u1EF1 luy\u1EBFn",
    "H\u1ECDc th\u1EA7y kh\xF4ng t\xE0y h\u1ECDc b\u1EA1n",
    "C\xE0 kh\u1ECBa \u0111am m\xEA kh\xF4ng l\u1ED1i tho\xE1t",
    "Check-in s\u1ED1ng \u1EA3o tri\u1EC7u like",
    "B\u1EADt ng\u1EEDa ng\u01A1 ng\xE1c ng\u1EE1 ng\xE0ng",
    "Xin v\xEDa gi\xE0u sang may m\u1EAFn",
    "Th\u1EA3 th\xEDnh d\xEDnh li\u1EC1n nh\u01B0 keo",
    "G\xE9t g\xF4 quy\u1EBFt t\xE2m l\xE0m t\u1EDBi c\xF9ng",
    "\u0102n c\u01A1m ch\xF3 ng\u1EADp h\u1ECDng ghen t\u1ECB",
    "C\u1EA9u l\u01B0\u01A1ng ng\u1ECDt ng\xE0o ph\xE1t \xF3i",
    "\xDA \xF2a gi\u1EADt m\xECnh h\xFA h\u1ED3n",
    "Qu\xE1 \u0111\xE3 lu\xF4n b\u1EA1n \u01A1i",
    "\u0110\xFAng nh\u1EADn sai c\xE3i h\u1ED9 c\xF4",
    "H\u1EBFt n\u01B0\u1EDBc ch\u1EA5m ngon xu\u1EA5t s\u1EAFc",
    "Ch\xE1y ph\u1ED1 \u0111\xEAm nay qu\u1EA9y tung n\xF3c",
    "C\u1EE9u b\u1ED3 kh\u1EA9n c\u1EA5p l\xFAc nguy nan",
    "T\xE2m linh kh\xF4ng \u0111\xF9a \u0111\u01B0\u1EE3c \u0111\xE2u",
    "\u1EE6a em g\xE1i m\u01B0a l\xE0 ai",
    "Mang ti\u1EC1n v\u1EC1 cho m\u1EB9 \u0111\u1EEBng mang mu\u1ED9n phi\u1EC1n",
    "H\u1ED3ng nhan b\u1EA1c ph\u1EADn b\u1EA1c t\xECnh",
    "Tr\xFAng s\u1ED1 \u0111\u1ED9c \u0111\u1EAFc \xF4m b\u1ECDc ti\u1EC1n",
    "T\u1ECF t\xECnh th\u1EA5t b\u1EA1i d\u01B0\u1EDBi m\u01B0a",
    "Tr\xE8o c\xE2y kh\u1EBF h\xE1i tr\xFAng t\u1ED5 ong",
    "B\u1EAFt c\xE1 hai tay tu\u1ED9t c\u1EA3 \u0111\xF4i",
    "\u0110\u1EE9ng n\xFAi n\xE0y tr\xF4ng n\xFAi n\u1ECD",
    "N\u01B0\u1EDBc \u0111\u1EBFn ch\xE2n m\u1EDBi ch\u1ECBu nh\u1EA3y v\u1ECDt",
    "Tr\u1EE9ng \u0111\xF2i kh\xF4n h\u01A1n v\u1ECBt m\u1EB9"
  ],
  "Thi\xEAn nhi\xEAn & \u0110\u1ECBa danh": [
    "N\xFAi l\u1EEDa phun tr\xE0o dung nham \u0111\u1ECF",
    "C\u1EA7u v\u1ED3ng b\u1EA3y s\u1EAFc sau c\u01A1n m\u01B0a",
    "Sao b\u0103ng r\u01A1i v\xE8o gi\u1EEFa tr\u1EDDi \u0111\xEAm",
    "\u0110\u1ED9ng \u0111\u1EA5t rung chuy\u1EC3n \u0111\u1ED3 \u0111\u1EA1c \u0111\u1ED5",
    "B\xE3o c\xE1t sa m\u1EA1c m\u1ECBt m\xF9",
    "Th\xE1c n\u01B0\u1EDBc h\xF9ng v\u0129 tung b\u1ECDt tr\u1EAFng",
    "B\u0103ng tuy\u1EBFt tan ch\u1EA3y tr\xF4i n\u1ED5i",
    "R\u1EEBng ng\u1EADp m\u1EB7n \u0111\u01B0\u1EDBc m\u1ECDc r\u1EC5",
    "Hang \u0111\u1ED9ng th\u1EA1ch nh\u0169 lung linh",
    "S\xF3ng th\u1EA7n cu\u1ED3n cu\u1ED9n \u1EADp b\u1EDD",
    "V\u1ECBnh H\u1EA1 Long non n\u01B0\u1EDBc tr\xF9ng \u0111i\u1EC7p",
    "\u0110\u1EC9nh Fansipan n\xF3c nh\xE0 \u0110\xF4ng D\u01B0\u01A1ng",
    "Ch\xF9a M\u1ED9t C\u1ED9t \u0111\xE0i sen n\u1EDF",
    "C\u1EA7u V\xE0ng b\xE0n tay kh\u1ED5ng l\u1ED3 \u0110\xE0 N\u1EB5ng",
    "H\u1ED3 G\u01B0\u01A1m Th\xE1p R\xF9a c\u1ED5 k\xEDnh",
    "C\u1ED9t c\u1EDD L\u0169ng C\xFA \u0111\u1ECBa \u0111\u1EA7u T\u1ED5 qu\u1ED1c",
    "C\u1ED1 \u0111\xF4 Hu\u1EBF l\u0103ng t\u1EA9m tr\u1EA7m m\u1EB7c",
    "Ph\u1ED1 c\u1ED5 H\u1ED9i An \u0111\xE8n l\u1ED3ng lung linh",
    "Ch\u1EE3 n\u1ED5i C\xE1i R\u0103ng thuy\u1EC1n ghe t\u1EA5p n\u1EADp",
    "M\u0169i C\xE0 Mau r\u1EEBng \u0111\u01B0\u1EDBc bao la",
    "Kim t\u1EF1 th\xE1p Ai C\u1EADp b\xED \u1EA9n",
    "Th\xE1p Eiffel Paris tr\xE1ng l\u1EC7",
    "T\u01B0\u1EE3ng N\u1EEF th\u1EA7n T\u1EF1 do c\u1EA7m \u0111u\u1ED1c",
    "V\u1EA1n L\xFD Tr\u01B0\u1EDDng Th\xE0nh u\u1ED1n l\u01B0\u1EE3n",
    "Th\xE1p nghi\xEAng Pisa s\u1EAFp \u0111\u1ED5",
    "\u0110\u1ED3ng h\u1ED3 Big Ben n\u01B0\u1EDBc Anh g\xF5 chu\xF4ng",
    "Nh\xE0 h\xE1t con s\xF2 Sydney n\u01B0\u1EDBc \xDAc",
    "N\xFAi Ph\xFA S\u0129 tuy\u1EBFt ph\u1EE7 tr\u1EAFng x\xF3a",
    "H\u1EBBm n\xFAi Grand Canyon k\u1EF3 v\u0129",
    "B\u1EAFc c\u1EF1c quang \xE1nh s\xE1ng xanh huy\u1EC1n \u1EA3o"
  ]
};
var categories = Object.keys(wordBank);

// api/room-store.ts
var RoomStoreError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "RoomStoreError";
  }
};
var TURN_LENGTH_MS = 6e4;
var ROOM_TTL_MS = 8 * 60 * 60 * 1e3;
var ONLINE_WINDOW_MS = 3e4;
var ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var MAX_PLAYERS_PER_ROOM = 8;
var globalStore = globalThis;
if (!globalStore.__HBOMY_ROOMS__) {
  globalStore.__HBOMY_ROOMS__ = /* @__PURE__ */ new Map();
}
var rooms = globalStore.__HBOMY_ROOMS__;
function shuffled(items) {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : Object.values(wordBank)[0] || [];
  const result = [...safeItems];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomBytes(4).readUInt32BE(0) % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
function createRoomCode() {
  let code = "";
  const random = randomBytes(6);
  for (const value of random) {
    code += ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length];
  }
  return code;
}
function createPlayerToken() {
  return randomBytes(32).toString("base64url");
}
function clearDrawing(room) {
  room.drawingStrokes = [];
  room.drawingRevision += 1;
}
function expireInactiveRooms(now) {
  for (const [code, room] of rooms) {
    if (now - room.lastActivityAt > ROOM_TTL_MS) rooms.delete(code);
  }
}
function findRoom(code) {
  expireInactiveRooms(Date.now());
  const cleanCode = code.trim().toUpperCase();
  const room = rooms.get(cleanCode);
  if (!room) throw new RoomStoreError(404, "Kh\xF4ng t\xECm th\u1EA5y ph\xF2ng n\xE0y.");
  return room;
}
function playerIndexForToken(room, token) {
  if (!token) throw new RoomStoreError(401, "Phi\xEAn ch\u01A1i kh\xF4ng h\u1EE3p l\u1EC7.");
  const index = room.players.findIndex((player) => player.token === token);
  if (index < 0) throw new RoomStoreError(401, "Phi\xEAn ch\u01A1i kh\xF4ng h\u1EE3p l\u1EC7.");
  return index;
}
function remainingMilliseconds(room, now) {
  if (room.status === "paused") {
    return Math.max(0, room.pausedRemainingMs ?? TURN_LENGTH_MS);
  }
  if (room.status !== "playing" || room.turnEndsAt === null) {
    return TURN_LENGTH_MS;
  }
  return Math.max(0, room.turnEndsAt - now);
}
function finishExpiredTurns(room, now) {
  while (room.status === "playing" && room.turnEndsAt !== null && room.turnEndsAt <= now) {
    room.wordIndex += 1;
    room.correctThisTurn = 0;
    clearDrawing(room);
    if (room.turnIndex >= room.totalTurns - 1) {
      room.status = "results";
      room.turnEndsAt = null;
      return;
    }
    room.turnIndex += 1;
    room.turnEndsAt += TURN_LENGTH_MS;
  }
}
function roomView(room, playerIndex, now) {
  const currentDrawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;
  const isDrawer = currentDrawerIndex === playerIndex;
  const canSeePrompt = isDrawer && (room.status === "playing" || room.status === "paused");
  return {
    roomCode: room.code,
    status: room.status,
    players: room.players.map((player, index) => ({
      index,
      name: player.name,
      isHost: index === 0,
      online: now - player.lastSeenAt <= ONLINE_WINDOW_MS,
      score: room.scores[index] || 0
    })),
    category: room.category,
    turnIndex: room.turnIndex,
    totalTurns: room.totalTurns,
    drawerIndex: currentDrawerIndex,
    timeLeftSeconds: Math.min(
      60,
      Math.ceil(remainingMilliseconds(room, now) / 1e3)
    ),
    scores: [...room.scores],
    correctThisTurn: room.correctThisTurn,
    currentPrompt: canSeePrompt ? room.words[room.wordIndex % room.words.length] ?? null : null,
    drawingRevision: room.drawingRevision,
    drawingStrokes: room.drawingStrokes.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point })),
      color: stroke.color,
      size: stroke.size
    }))
  };
}
function touchPlayer(room, playerIndex, now) {
  const player = room.players[playerIndex];
  if (player) player.lastSeenAt = now;
  room.lastActivityAt = now;
}
function createRoom(input) {
  const now = Date.now();
  expireInactiveRooms(now);
  let code = createRoomCode();
  while (rooms.has(code)) code = createRoomCode();
  const token = createPlayerToken();
  const room = {
    code,
    players: [{ name: input.playerName, token, lastSeenAt: now }],
    category: input.category && wordBank[input.category] ? input.category : Object.keys(wordBank)[0],
    status: "waiting",
    turnIndex: 0,
    totalTurns: 4,
    // Mặc định, sẽ cập nhật khi bấm bắt đầu theo số lượng người
    turnEndsAt: null,
    pausedRemainingMs: null,
    scores: [0],
    correctThisTurn: 0,
    wordIndex: 0,
    words: shuffled(input.category && wordBank[input.category] ? wordBank[input.category] : Object.values(wordBank)[0]),
    drawingRevision: 0,
    drawingStrokes: [],
    lastActivityAt: now
  };
  rooms.set(code, room);
  return {
    roomCode: code,
    playerToken: token,
    playerIndex: 0,
    view: roomView(room, 0, now)
  };
}
function joinRoom(code, playerName) {
  const room = findRoom(code);
  const now = Date.now();
  const existingIndex = room.players.findIndex(
    (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
  );
  if (existingIndex >= 0) {
    const existingPlayer = room.players[existingIndex];
    existingPlayer.lastSeenAt = now;
    return {
      roomCode: room.code,
      playerToken: existingPlayer.token,
      playerIndex: existingIndex,
      view: roomView(room, existingIndex, now)
    };
  }
  if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
    throw new RoomStoreError(409, `Ph\xF2ng \u0111\xE3 \u0111\u1EA7y (t\u1ED1i \u0111a ${MAX_PLAYERS_PER_ROOM} ng\u01B0\u1EDDi).`);
  }
  if (room.status !== "waiting" && room.status !== "ready") {
    throw new RoomStoreError(409, "V\xE1n ch\u01A1i \u0111ang di\u1EC5n ra. H\xE3y \u0111\u1EE3i v\xE1n sau nh\xE9.");
  }
  const token = createPlayerToken();
  const newIndex = room.players.length;
  room.players.push({ name: playerName, token, lastSeenAt: now });
  room.scores.push(0);
  room.status = "ready";
  room.lastActivityAt = now;
  return {
    roomCode: room.code,
    playerToken: token,
    playerIndex: newIndex,
    view: roomView(room, newIndex, now)
  };
}
function getRoomViewForToken(code, token) {
  const room = findRoom(code);
  const playerIndex = playerIndexForToken(room, token);
  const now = Date.now();
  finishExpiredTurns(room, now);
  touchPlayer(room, playerIndex, now);
  return roomView(room, playerIndex, now);
}
function performRoomAction(code, token, action, targetGuesserIndex) {
  const room = findRoom(code);
  const playerIndex = playerIndexForToken(room, token);
  const now = Date.now();
  finishExpiredTurns(room, now);
  touchPlayer(room, playerIndex, now);
  if (action === "start") {
    if (playerIndex !== 0) {
      throw new RoomStoreError(403, "Ch\u1EC9 ch\u1EE7 ph\xF2ng m\u1EDBi c\xF3 th\u1EC3 b\u1EAFt \u0111\u1EA7u v\xE1n \u0111\u1EA5u.");
    }
    if (room.players.length < 2) {
      throw new RoomStoreError(400, "C\u1EA7n \xEDt nh\u1EA5t 2 ng\u01B0\u1EDDi trong ph\xF2ng \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u.");
    }
    room.status = "playing";
    room.turnIndex = 0;
    room.totalTurns = room.players.length * 2;
    room.turnEndsAt = now + TURN_LENGTH_MS;
    room.pausedRemainingMs = null;
    room.scores = room.players.map(() => 0);
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }
  if (action === "restart") {
    if (playerIndex !== 0) {
      throw new RoomStoreError(403, "Ch\u1EC9 ch\u1EE7 ph\xF2ng m\u1EDBi c\xF3 th\u1EC3 b\u1EAFt \u0111\u1EA7u l\u1EA1i.");
    }
    room.status = "ready";
    room.turnIndex = 0;
    room.turnEndsAt = null;
    room.pausedRemainingMs = null;
    room.scores = room.players.map(() => 0);
    room.correctThisTurn = 0;
    room.wordIndex = 0;
    room.words = shuffled(wordBank[room.category] ?? wordBank["\u0110\u1EDDi th\u01B0\u1EDDng"]);
    clearDrawing(room);
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }
  if (action === "pause") {
    if (room.status !== "playing") return roomView(room, playerIndex, now);
    room.pausedRemainingMs = remainingMilliseconds(room, now);
    room.turnEndsAt = null;
    room.status = "paused";
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }
  if (action === "resume") {
    if (room.status !== "paused") return roomView(room, playerIndex, now);
    room.status = "playing";
    room.turnEndsAt = now + (room.pausedRemainingMs ?? TURN_LENGTH_MS);
    room.pausedRemainingMs = null;
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }
  if (room.status !== "playing") {
    return roomView(room, playerIndex, now);
  }
  const currentDrawerIndex = room.turnIndex % room.players.length;
  if (currentDrawerIndex !== playerIndex) {
    throw new RoomStoreError(403, "Ch\u1EC9 ng\u01B0\u1EDDi \u0111ang v\u1EBD m\u1EDBi c\xF3 th\u1EC3 x\xE1c nh\u1EADn \u0111\xE1p \xE1n.");
  }
  if (action === "correct") {
    const secondsLeft = Math.floor(remainingMilliseconds(room, now) / 1e3);
    const guesserPoints = 100 + secondsLeft * 20;
    let awardedGuesser = targetGuesserIndex;
    if (awardedGuesser === void 0 || awardedGuesser === currentDrawerIndex || !room.players[awardedGuesser]) {
      awardedGuesser = room.players.findIndex((_, idx) => idx !== currentDrawerIndex);
    }
    if (awardedGuesser >= 0 && room.scores[awardedGuesser] !== void 0) {
      room.scores[awardedGuesser] += guesserPoints;
    }
    if (room.scores[currentDrawerIndex] !== void 0) {
      room.scores[currentDrawerIndex] += 50;
    }
    room.correctThisTurn += 1;
  }
  room.wordIndex += 1;
  clearDrawing(room);
  room.lastActivityAt = now;
  return roomView(room, playerIndex, now);
}
function updateRoomDrawing(code, token, input) {
  const room = findRoom(code);
  const playerIndex = playerIndexForToken(room, token);
  const now = Date.now();
  finishExpiredTurns(room, now);
  touchPlayer(room, playerIndex, now);
  const currentDrawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;
  if (room.status !== "playing" || currentDrawerIndex !== playerIndex) {
    return roomView(room, playerIndex, now);
  }
  if (input.revision >= room.drawingRevision) {
    room.drawingRevision = input.revision;
    room.drawingStrokes = input.strokes.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point })),
      color: stroke.color,
      size: stroke.size
    }));
  }
  return roomView(room, playerIndex, now);
}

// api/rooms.ts
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  if (!body || typeof body !== "object") {
    body = {};
  }
  const authHeader = req.headers["authorization"] || req.headers["Authorization"] || "";
  const tokenMatch = typeof authHeader === "string" ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
  const token = tokenMatch ? tokenMatch[1] : void 0;
  const rawUrl = req.url || "/";
  const cleanPath = rawUrl.split("?")[0];
  const pathParts = cleanPath.replace(/^\/api\/rooms\/?/, "").replace(/^\/rooms\/?/, "").split("/").filter(Boolean);
  try {
    if (pathParts.length === 0) {
      if (req.method === "POST") {
        const playerName = (body.playerName || "").trim();
        if (!playerName) {
          res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp t\xEAn ng\u01B0\u1EDDi ch\u01A1i." });
          return;
        }
        const session = createRoom({
          playerName,
          category: body.category || "\u0110\u1ED3 v\u1EADt & \u0110\u1EDDi th\u01B0\u1EDDng"
        });
        res.status(201).json(session);
        return;
      }
      res.status(200).json({ status: "ok", message: "API Hai B\u1ED9 \xD3c M\u1ED9t \xDD \u0111ang ho\u1EA1t \u0111\u1ED9ng t\u1ED1t." });
      return;
    }
    const roomCode = (pathParts[0] || req.query && req.query.roomCode || "").toUpperCase();
    const subAction = pathParts[1];
    if (!roomCode) {
      res.status(400).json({ error: "M\xE3 ph\xF2ng kh\xF4ng h\u1EE3p l\u1EC7." });
      return;
    }
    if (req.method === "POST" && subAction === "join") {
      const playerName = (body.playerName || "").trim();
      if (!playerName) {
        res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp t\xEAn tr\u01B0\u1EDBc khi v\xE0o ph\xF2ng." });
        return;
      }
      const session = joinRoom(roomCode, playerName);
      res.status(200).json(session);
      return;
    }
    if (req.method === "GET" && !subAction) {
      const view = getRoomViewForToken(roomCode, token);
      res.status(200).json(view);
      return;
    }
    if (req.method === "POST" && subAction === "actions") {
      const action = body.action;
      if (!action) {
        res.status(400).json({ error: "Thi\u1EBFu tr\u01B0\u1EDDng h\xE0nh \u0111\u1ED9ng (action)." });
        return;
      }
      const view = performRoomAction(roomCode, token, action, body.targetGuesserIndex);
      res.status(200).json(view);
      return;
    }
    if (req.method === "PUT" && subAction === "drawing") {
      const revision = typeof body.revision === "number" ? body.revision : 0;
      const strokes = Array.isArray(body.strokes) ? body.strokes : [];
      const view = updateRoomDrawing(roomCode, token, { revision, strokes });
      res.status(200).json(view);
      return;
    }
    res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y endpoint y\xEAu c\u1EA7u." });
  } catch (error) {
    if (error instanceof RoomStoreError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("Room API Error:", error);
    res.status(500).json({ error: error?.message || "L\u1ED7i x\u1EED l\xFD API n\u1ED9i b\u1ED9." });
  }
}
export {
  handler as default
};
