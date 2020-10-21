import { Bitmap, assert } from "..";

type User = {
    settings: number;
};
  
let user: User = {
    settings: 2
};
  
enum SettingTypes {
    is_autowalk_enabled,
    is_autoeat_enabled
}

let bitmap = new Bitmap<SettingTypes>(user.settings);

console.info("Num: ", bitmap.getNumber());
console.info("is_autowalk_enabled = ", bitmap.get(SettingTypes.is_autowalk_enabled));
console.info("is_autoeat_enabled = ", bitmap.get(SettingTypes.is_autoeat_enabled));

bitmap.switch(SettingTypes.is_autoeat_enabled);

console.info("Switched is_autoeat_enabled = ", bitmap.get(SettingTypes.is_autoeat_enabled));

bitmap.set(SettingTypes.is_autowalk_enabled, true);
bitmap.set(SettingTypes.is_autoeat_enabled, true);

console.info("Set is_autowalk_enabled = ", bitmap.get(SettingTypes.is_autowalk_enabled));

console.info(bitmap.getNumber().toString(2));