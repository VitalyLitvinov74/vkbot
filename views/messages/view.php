<?php

use yii\helpers\Html;
use yii\widgets\DetailView;

/* @var $this yii\web\View */
/* @var $model app\models\tables\Messages */

$this->title = 'View message: ' . $model->id;
$this->params['breadcrumbs'][] = ['label' => 'bots', 'url' => ['messages/bots']];
$this->params['breadcrumbs'][] = ['label' => $botName, 'url'=>['messages/index', 'botName'=>$botName]];
$this->params['breadcrumbs'][] = "View";
\yii\web\YiiAsset::register($this);
?>
<div class="messages-view">

    <h1><?= Html::encode($this->title) ?></h1>

    <p>
        <?= Html::a('Update', ['update', 'botName'=>$model->bot_id, 'id' => $model->id], ['class' => 'btn btn-primary']) ?>
<!--        <?//= Html::a('Delete', ['delete', 'id' => $model->id], [
//            'class' => 'btn btn-danger',
//            'data' => [
//                'confirm' => 'Are you sure you want to delete this item?',
//                'method' => 'post',
//            ],
//        ]) ?> -->
    </p>

    <?= DetailView::widget([
        'model' => $model,
        'attributes' => [
            'id',
            'option_message',
            'value_message',
            'bot_id',
        ],
    ]) ?>

</div>
