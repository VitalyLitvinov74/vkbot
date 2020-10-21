<?php

use yii\db\Migration;

/**
 * Class m201021_114847_add_message_table
 */
class m201021_114847_add_message_table extends Migration
{
    /**
     * {@inheritdoc}
     * Эта миграция нужна для создания круд
     */
    public function safeUp()
    {
        $this->createTable('messages', [
            'id'=>$this->primaryKey(),
            'option_message'=>$this->string()->defaultValue(''),
            'value_message'=>$this->string()->defaultValue(''),
            'bot_id'=>$this->string()
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropTable('messages');
    }

    /*
    // Use up()/down() to run migration code without a transaction.
    public function up()
    {

    }

    public function down()
    {
        echo "m201021_114847_add_message_table cannot be reverted.\n";

        return false;
    }
    */
}
