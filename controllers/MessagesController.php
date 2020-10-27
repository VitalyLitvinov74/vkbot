<?php

namespace app\controllers;

use Yii;
use app\models\tables\Messages;
use yii\data\ActiveDataProvider;
use yii\data\ArrayDataProvider;
use yii\filters\AccessControl;
use yii\helpers\VarDumper;
use yii\web\Controller;
use yii\web\NotFoundHttpException;
use yii\filters\VerbFilter;

/**
 * MessagesController implements the CRUD actions for Messages model.
 */
class MessagesController extends Controller
{
    /**
     * {@inheritdoc}
     */
    public function behaviors()
    {
        return [
            'verbs' => [
                'class' => VerbFilter::className(),
                'actions' => [
                    'delete' => ['POST'],
                ],
            ],
            'access'=>[
                'class' => AccessControl::className(),
                'rules'=>[
                    [
                        'allow' => true,
                        'roles' => ['@'],
                        'matchCallback' => function ($rule, $action) {
                            return !Yii::$app->user->isGuest;
                        }
                    ]
                ],
            ]
        ];
    }

    public function actionBots(){
        $arr = [];
        foreach (glob(Yii::getAlias('@app')."/groupbot*") as $key=>$filename) {
            $arr[] = [
                'id'=>$key,
                'botName'=> basename($filename)
            ];
        }
        $dataProvider = new ArrayDataProvider([
            'allModels'=>$arr,
            'pagination' => [
                'pageSize' => 30,
            ],
            'sort'=>[
                'attributes'=> ['id', 'botName']
            ],
        ]);
        return $this->render('bots', compact('dataProvider'));
    }

    /**
     * Lists all Messages models.
     * @return mixed
     */
    public function actionIndex(string $botName)
    {
        $messages = new \app\models\files\Messages($botName);
        $dataProvider = new ArrayDataProvider(
            [
                'allModels'=>$messages->all(),
                'sort'=>[
                    'attributes'=> ['id', 'option_message', 'value_message']
                ],
                'pagination' => [
                    'pageSize' => 30,
                ]
            ]
        );

        return $this->render('index', [
            'dataProvider' => $dataProvider,
            'botName'=>$botName
        ]);
    }

    /**
     * Displays a single Messages model.
     * @param integer $id
     * @return mixed
     * @throws NotFoundHttpException if the model cannot be found
     */
    public function actionView($id, $botName)
    {
        return $this->render('view', [
            'model' => new Messages($this->findModel($botName, $id)),
            'botName'=>$botName
        ]);
    }

    /**
     * Creates a new Messages model.
     * If creation is successful, the browser will be redirected to the 'view' page.
     * @return mixed
     */
    public function actionCreate()
    {
        //пока пустой.
        $model = new Messages();
        if ($model->load(Yii::$app->request->post()) && $model->save()) {
            return $this->redirect(['view', 'id' => $model->id]);
        }

        return $this->render('create', [
            'model' => $model,
        ]);
    }

    /**
     * Updates an existing Messages model.
     * If update is successful, the browser will be redirected to the 'view' page.
     * @param integer $id
     * @return mixed
     * @throws NotFoundHttpException if the model cannot be found
     */
    public function actionUpdate($id, $botName)
    {
        $model = new Messages($this->findModel($botName,$id));
        if ($model->load(Yii::$app->request->post()) and $model->save()) {
            return $this->redirect(['view', 'id' => $model->id, 'botName'=>$botName]);
        }

        return $this->render('update', [
            'model' => $model,
            'botName'=>$botName
        ]);
    }

    /**
     * Deletes an existing Messages model.
     * If deletion is successful, the browser will be redirected to the 'index' page.
     * @param integer $id
     * @return mixed
     * @throws NotFoundHttpException if the model cannot be found
     */
    public function actionDelete($id)
    {
        $this->findModel($id)->delete();

        return $this->redirect(['index']);
    }

    /**
     * Finds the Messages model based on its primary key value.
     * If the model is not found, a 404 HTTP exception will be thrown.
     * @param integer $id
     * @param $botName - имя бота
     * @return array the loaded model
     * @throws NotFoundHttpException if the model cannot be found
     */
    protected function findModel($botName, $id): array
    {
        if (($model = \app\models\files\Messages::findOne($botName, $id)) !== []) {
            return $model;
        }
        throw new NotFoundHttpException('The requested page does not exist.');
    }
}
