export function parseDollarValue(string){
    if(string.length === 0) return NaN;
    let multiplier;
    if(string[0] === '-'){
        multiplier = -1;
        string = string.substring(1);
    } else {
        multiplier = 1;
    }
    let periodIndex = string.indexOf('.');
    if(periodIndex === -1){
        multiplier *= 100;
    } else if (periodIndex === string.length - 2){
        multiplier *= 10;
    } else if (periodIndex !== string.length - 3){
        return NaN;
    }
    let charArray = Array.from(string);
    let value = 0;
    for(let i = 0; i < charArray.length; i++) {
        if (i === periodIndex)
            continue;
        let charCode = charArray[i].charCodeAt(0)
        if(charCode < 48 || charCode > 57){
            return NaN;
        }
        value *= 10;
        value += charArray[i].charCodeAt(0) - 48;
    }
    return value * multiplier;
}