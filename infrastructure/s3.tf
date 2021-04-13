resource "aws_s3_bucket" "default" {
  bucket = "${var.app_name}-${local.environment}"
  acl    = "private"

  lifecycle {
    prevent_destroy = false
  }

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}
