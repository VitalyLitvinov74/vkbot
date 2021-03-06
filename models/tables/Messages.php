<?php


namespace app\models\tables;


use yii\db\ActiveRecord;
use yii\helpers\VarDumper;

class Messages extends ActiveRecord
{
    public $id;
    public $option_message;
    public $value_message;
    public $bot_id;

    public function rules()
    {
        return [
            [['option_message', 'value_message'], 'required']
        ];
    }

    public function save($runValidation = true, $attributeNames = null)
    {
        $messages = new \app\models\files\Messages($this->bot_id);
        $all_messages = $messages->all();
        $arrayForSave = [];
        foreach ($all_messages as $key => $arrayValues) {
            if ($arrayValues['id'] == $this->id) {
                $arrayForSave[$this->option_message] = $this->value_message;
            }else{
                $arrayForSave[$arrayValues['option_message']] = $arrayValues['value_message'];
            }
        }
        return $messages->save($arrayForSave);
//        return parent::save($runValidation, $attributeNames); // TODO: Change the autogenerated stub
    }
}