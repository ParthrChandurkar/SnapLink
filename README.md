# SnapLink

SnapLink is a serverless URL shortener and per-link analytics dashboard. AWS Lambda functions create short links, redirect visitors, and aggregate click data; a React frontend presents link creation and analytics views.

## Features

- Random fixed-width base62 short codes
- HTTP and HTTPS URL validation
- Conditional DynamoDB writes for collision protection
- Redirect-time click recording and atomic counters
- Country, device, browser, referrer, and timestamp analytics
- React and Recharts analytics interface
- AWS SAM infrastructure template
- CloudWatch logs, X-Ray tracing, and an aggregate error alarm
- GitHub Actions deployment workflow

## Architecture

API Gateway routes requests to separate shorten, redirect, and analytics Lambda functions. DynamoDB stores URL mappings and click events. The redirect function optionally calls `ip-api.com` for best-effort country lookup. The frontend can be hosted from the encrypted S3 bucket and CloudFront distribution defined in the SAM template, or deployed separately to Vercel.

Each Lambda receives a separate IAM role in [`infrastructure/template.yaml`](infrastructure/template.yaml).

## Tech Stack

- Python AWS Lambda functions
- API Gateway HTTP API
- DynamoDB
- AWS SAM and CloudFormation
- S3, CloudFront, CloudWatch, X-Ray, and SNS
- React, Vite, Tailwind CSS, and Recharts
- GitHub Actions

## Prerequisites

- Node.js and npm
- Python as required by the SAM build image
- AWS CLI configured for the target account
- AWS SAM CLI
- Docker for local SAM emulation

## Local Frontend

```powershell
Set-Location frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to a deployed API Gateway URL or a local SAM endpoint.

## Local API

From the repository root:

```bash
sam validate --lint --template-file infrastructure/template.yaml
sam build --template-file infrastructure/template.yaml
sam local start-api --template .aws-sam/build/template.yaml
```

The local API normally listens on `http://127.0.0.1:3000`. Public IP geolocation is limited in local emulation, so country values may be reported as unknown.

## AWS Deployment

Validate, build, and deploy the stack:

```bash
aws sts get-caller-identity
sam validate --lint --template-file infrastructure/template.yaml
sam build --template-file infrastructure/template.yaml
sam deploy --guided --capabilities CAPABILITY_NAMED_IAM
```

Use the CloudFormation outputs to configure `VITE_API_BASE_URL`, locate the frontend bucket, and identify the CloudFront distribution. Build the frontend with `npm run build` from `frontend/`, upload `frontend/dist` to the output bucket, and invalidate the distribution after changes.

The GitHub Actions workflow requires AWS credentials and region settings as repository secrets. Prefer short-lived federated credentials over long-lived access keys when adapting the workflow.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/shorten` | Validate a destination and create a short code |
| `GET` | `/{shortcode}` | Record an event and redirect to the destination |
| `GET` | `/analytics/{shortcode}` | Return aggregate analytics for one code |

## Limitations

- The free `ip-api.com` integration is best-effort and HTTP-based.
- Authentication, user ownership, team workspaces, and a global administration view are not implemented.
- The frontend uses one API base URL at build time.
- Custom domains require DNS and API Gateway configuration outside the base template.

## License

SnapLink is licensed under the terms in [`LICENSE`](LICENSE).

