<?php

use yii\helpers\Html;

/* @var $this yii\web\View */
/* @var $model app\models\tables\Messages */

$this->title = 'Update Messages: ' . $model->id;
$this->params['breadcrumbs'][] = ['label' => 'bots', 'url' => ['messages/bots']];
$this->params['breadcrumbs'][] = ['label' => $botName, 'url'=>['messages/index', 'botName'=>$botName]];
$this->params['breadcrumbs'][] = ['label' => $model->id, 'url' => ['view', 'id' => $model->id, 'botName'=>$botName]];
$this->params['breadcrumbs'][] = 'Update';
?>
<div class="messages-update">

    <h1><?= Html::encode($this->title) ?></h1>

    <?= $this->render('_form', [
        'model' => $model,
    ]) ?>

</div>
