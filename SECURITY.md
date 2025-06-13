# Security Guidelines

## Environment Variables

**IMPORTANT:** Never commit sensitive credentials to git. All AWS credentials and database passwords should be stored in environment variables.

### Required Environment Variables

Create a `.env` file in the root directory with:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=car_parking

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name
```

### Security Best Practices

1. **Never hardcode credentials** in source files
2. **Use environment variables** for all sensitive data
3. **Keep .env files local** (never commit them)
4. **Rotate credentials regularly**
5. **Use IAM roles** in production environments
6. **Limit AWS permissions** to minimum required access

### Git Security

The `.env` file is already excluded in `.gitignore`. If you accidentally commit credentials:

1. **Immediately rotate** the exposed credentials
2. **Remove them from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** the cleaned history
4. **Update all team members** about the incident

## Reporting Security Issues

If you discover a security vulnerability, please email us directly instead of opening a public issue. 