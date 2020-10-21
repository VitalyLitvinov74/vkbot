<?php


namespace app\models\files;

use Yii;

/**
 * @property string $botName - имя папки бота.
*/
class Messages
{
    private $botName;

    /**
     * @param string $botName Имя бота которого нужно отобразить
     */
    public function __construct(string $botName) {
        $this->botName = $botName;
    }

    public function all(): array{
        $botDir = Yii::getAlias('@app/' . $this->botName);
        if(file_exists($botDir)){
            $array = json_decode(
                file_get_contents($botDir . '/' . 'storage.json'),
                true
            );
            return $this->mapping($array);

        }

        return [];
    }

    /**
     * передает на вход ключ значение.
     * @param array $array [$key=>$value]
     * @return array ["option_message"=>$key, value_message=>$val]
     */
    private function mapping(array $array): array {
        $return_array = [];
        $id = 1;
        foreach ($array as $key=>$value){
            $return_array[] = [
              'id'=>$id,
              'option_message'=>$key,
              'value_message'=>$value,
              'bot_id'=>$this->botName
            ];
            $id++;
        }
        return $return_array;
    }
}