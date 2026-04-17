import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OpenApiGatewayToLambda } from '@aws-solutions-constructs/aws-openapigateway-lambda';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

export class OccupyCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const tableProps = {
            partitionKey: {
                name: 'Id',
                type: ddb.AttributeType.STRING,
            },
        };

        const recordApparatus = new LambdaToDynamoDB(this, 'Games', {
            lambdaFunctionProps: {
                runtime: lambda.Runtime.NODEJS_18_X,
                handler: 'index.handler',
                code: lambda.Code.fromAsset(`lambda/game`),
            },
            dynamoTableProps: tableProps,
        });

        const newApi = new OpenApiGatewayToLambda(
            this,
            'OpenApiGatewayToLambda',
            {
                apiDefinitionAsset: new Asset(this, 'ApiDefinitionAsset', {
                    path: path.join(`api`, 'occupy.yml'),
                }),
                apiIntegrations: [
                    {
                        id: 'GameHandler',
                        existingLambdaObj: recordApparatus.lambdaFunction,
                    },
                ],
            },
        );

        new cdk.CfnOutput(this, 'GameUrl', {
            value: newApi.apiGateway.url + 'order',
        });
    }
}
