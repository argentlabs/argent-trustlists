terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }

  backend "s3" {
    bucket               = "terraform.eu-west-1.argent47.net"
    workspace_key_prefix = "workspace-trustlist"
    key                  = "tfstate.json"
    dynamodb_table       = "argent-dev-terraform"
    region               = "eu-west-1"
  }
}

locals {
  environment = terraform.workspace
  role        = var.workspace_iam_roles[terraform.workspace]
}

provider "aws" {
  region = "eu-west-1"

  assume_role {
    role_arn = local.role
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  assume_role {
    role_arn = local.role
  }
}

data "terraform_remote_state" "main" {
  backend = "s3"

  workspace = terraform.workspace

  config = {
    bucket               = "terraform.eu-west-1.argent47.net"
    workspace_key_prefix = "workspace"
    key                  = "tfstate.json"
    region               = "eu-west-1"
  }
}

data "aws_s3_bucket" "devops" {
  bucket = data.terraform_remote_state.main.outputs.s3_devops_bucket_name
}
