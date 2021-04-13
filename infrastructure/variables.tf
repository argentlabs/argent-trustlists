variable "workspace_iam_roles" {
  type = map(string)

  default = {
    test    = "arn:aws:iam::049993856456:role/Terraform"
    staging = "arn:aws:iam::911160948013:role/Terraform"
    prod    = "arn:aws:iam::372157827898:role/Terraform"
  }
}

variable "app_name" {
  default = "argent-trustlists"
}

variable "aliases" {
  type = map(any)

  default = {
    test    = ["trustlists.argent-security.xyz"]
    staging = ["trustlists.argent-test.xyz"]
    prod    = ["trustlists.argent.xyz"]
  }
}

variable "acm_certificate_domain" {
  type = map(string)

  default = {
    test    = "*.argent-security.xyz"
    staging = "*.argent-test.xyz"
    prod    = "*.argent-prod.xyz"
  }
}
