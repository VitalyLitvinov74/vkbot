import { parseDateTime } from "..";

console.info(parseDateTime("12.02.2018 16:10"));
console.info(parseDateTime("12.02.201816:10"));
console.info(parseDateTime("16:10 12.02.2018"));