<?php


namespace app\models\files;

use Yii;
use yii\helpers\ArrayHelper;

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
        $id = 0;
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

    /**
     * @param string $botName - имя бота в котором нужно искать.
     * @param int $id - начиная с 0
     * @return mixed
     */
    public static function findOne(string $botName, int $id): array{
        $messages = new self($botName);
        $messages = $messages->all();
        if (isset($messages[$id])) {
            return $messages[$id];
        }
        return [];
    }

    public function save(array $messages): bool{

        $botDir = Yii::getAlias('@app/' . $this->botName);
        $result = false;
        if(file_exists($botDir)){
            $fp = fopen($botDir . '/' . 'storage.json' , 'w+');
            $result = fwrite($fp, json_encode($messages));
            $result = fclose($fp);
        }
        if($result!==false){
            return true;
        }
        return $result;
    }
}