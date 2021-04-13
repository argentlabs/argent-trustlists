output "s3_bucket_name" {
  value = aws_s3_bucket.default.bucket
}

output "iam_workspace_role" {
  value = local.role
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.default.id
}
