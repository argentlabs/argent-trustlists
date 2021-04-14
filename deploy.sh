# exit when any command fails
set -e

# read arguments
env=$1
action=$2

# select terraform workspace
terraform -chdir=infrastructure workspace select $env

# terraform apply/plan
if [ "$action" = "plan" ];
then
  terraform -chdir=infrastructure plan
  exit;
elif [ "$action" = "apply" ];
then
  terraform -chdir=infrastructure apply -auto-approve
fi

# get assumed role and devops bucket name from terraform
terraform_output=`terraform -chdir=infrastructure output -json`
if [ `echo $terraform_output | jq length` -eq "0" ]; then
  echo "no terraform output";
  exit;
fi

iam_workspace_role=`echo $terraform_output | jq -r '.iam_workspace_role .value'`
s3_bucket_name=`echo $terraform_output | jq -r '.s3_bucket_name .value'`
cloudfront_distribution_id=`echo $terraform_output | jq -r '.cloudfront_distribution_id .value'`

# build web app
REACT_APP_ENV=${env} yarn --cwd ./web build

# get credentials to perform task in the the environment
credentials=`aws sts assume-role --role-arn $iam_workspace_role --role-session-name "DeploymentSession"`

export AWS_ACCESS_KEY_ID=`echo $credentials | jq -r '.Credentials .AccessKeyId'`
export AWS_SECRET_ACCESS_KEY=`echo $credentials | jq -r '.Credentials .SecretAccessKey'`
export AWS_SESSION_TOKEN=`echo $credentials | jq -r '.Credentials .SessionToken'`
export AWS_SECURITY_TOKEN=`echo $credentials | jq -r '.Credentials .SessionToken'`
export AWS_SESSION_EXPIRATION=`echo $credentials | jq -r '.Credentials .Expiration'`

# sync s3 bucket and invalidate cloudfront distribution
aws s3 sync --acl public-read --sse --delete ./web/build s3://${s3_bucket_name}
aws cloudfront create-invalidation --distribution-id ${cloudfront_distribution_id} --paths '/*'
