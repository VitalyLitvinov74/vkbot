<?php

use yii\helpers\Html;
use yii\grid\GridView;
use yii\helpers\Url;
use yii\widgets\Pjax;
/* @var $this yii\web\View */
/* @var $dataProvider yii\data\ActiveDataProvider */
$this->title = 'Messages';
$this->params['breadcrumbs'][] = ['label'=>'bots', 'url'=> Url::toRoute(['messages/bots'])];
$this->params['breadcrumbs'][] = $botName;
?>
<div class="messages-index">

    <h1><?= Html::encode($this->title) ?></h1>
    <?php Pjax::begin(); ?>
    <?= GridView::widget([
        'dataProvider' => $dataProvider,
        'columns' => [
//            ['class' => 'yii\grid\SerialColumn'],
            'id',
            'option_message',
            'value_message',

            [
                    'class' => 'yii\grid\ActionColumn',
                    'visibleButtons' => [
                        'delete' => function ($model, $key, $index) {
                            return false;
                         }
                    ],
                    'urlCreator' => function ($action, $model, $key, $index) {
                        if ($action === 'view') {
                            $url = Url::toRoute(['messages/view', 'botName'=>$model['bot_id'], 'id'=>$model['id']]);
                        }

                        if ($action === 'update') {
                            $url = Url::toRoute(['messages/update', 'botName'=>$model['bot_id'], 'id'=>$model['id']]);
                        }
                        return $url;
                    }
],
        ],
    ]); ?>

    <?php Pjax::end(); ?>

</div>
