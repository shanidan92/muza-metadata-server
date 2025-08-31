# Admin UI Security Configuration

The Muza admin UI (FLAC uploader) should only be accessible via VPN for security purposes.

## Network-Level Security (Recommended)

### AWS Security Groups

Configure your EC2/ECS security groups to only allow admin UI traffic from your VPN subnet:

```yaml
# Security Group for Admin UI
Type: AWS::EC2::SecurityGroup
Properties:
  GroupDescription: Muza Admin UI - VPN Only Access
  VpcId: !Ref VPC
  SecurityGroupIngress:
    - IpProtocol: tcp
      FromPort: 5002 # Admin UI port
      ToPort: 5002
      CidrIp: 10.0.0.0/8 # Replace with your VPN subnet CIDR
      Description: 'Admin UI access from VPN only'
    - IpProtocol: tcp
      FromPort: 5000 # Main API can be more open if needed
      ToPort: 5000
      CidrIp: 0.0.0.0/0 # Or restrict this too
      Description: 'GraphQL API access'
```

### Application Load Balancer Rules

If using ALB, configure rules to restrict admin UI access:

```yaml
# ALB Listener Rule for Admin UI
Type: AWS::ElasticLoadBalancingV2::ListenerRule
Properties:
  Actions:
    - Type: forward
      TargetGroupArn: !Ref AdminUITargetGroup
  Conditions:
    - Field: path-pattern
      Values: ['/admin/*']
    - Field: source-ip
      Values:
        - '10.0.0.0/8' # VPN subnet
  ListenerArn: !Ref ALBListener
  Priority: 100
```

## Application-Level Security

### Option B: IP Allowlist Middleware

Add IP filtering directly to the admin UI application:

```python
# In utils/uploader.py - add this middleware
from flask import abort, request
import ipaddress

def require_vpn_access():
    """Middleware to restrict access to VPN IPs only"""
    allowed_networks = [
        ipaddress.ip_network('10.0.0.0/8'),      # VPN subnet
        ipaddress.ip_network('127.0.0.1/32'),    # localhost for dev
    ]

    client_ip = ipaddress.ip_address(request.environ.get('HTTP_X_FORWARDED_FOR',
                                                       request.remote_addr))

    if not any(client_ip in network for network in allowed_networks):
        abort(403)  # Forbidden

# Apply to all admin routes
@app.before_request
def check_vpn_access():
    require_vpn_access()
```

### Option C: Basic Authentication

Add simple HTTP basic auth as an additional layer:

```python
from flask_httpauth import HTTPBasicAuth
from werkzeug.security import check_password_hash, generate_password_hash

auth = HTTPBasicAuth()

users = {
    "admin": generate_password_hash(os.getenv("ADMIN_PASSWORD", "changeme"))
}

@auth.verify_password
def verify_password(username, password):
    if username in users and check_password_hash(users.get(username), password):
        return username

# Protect admin routes
@app.route('/')
@auth.login_required
def index():
    return render_template('index.html')
```

## Deployment Patterns

### Pattern 1: Separate Services

Deploy admin UI and main API as separate services with different security policies:

```yaml
# docker-compose.yml
version: '3.8'
services:
  metadata-server:
    build: .
    ports:
      - '5000:5000' # Public API
    environment:
      - DATABASE_URL=postgresql://...

  admin-ui:
    build: .
    command: python -m utils.uploader
    ports:
      - '127.0.0.1:5002:5002' # Bind to localhost only
    environment:
      - MUZA_SERVER_URL=http://metadata-server:5000/graphql
    networks:
      - admin_network # Private network

networks:
  admin_network:
    driver: bridge
    internal: true # No external access
```

### Pattern 2: VPN Gateway

Use AWS VPN or similar to create secure tunnel:

1. Set up AWS Client VPN or Site-to-Site VPN
2. Deploy admin UI in private subnet
3. Route admin traffic through VPN only

## Environment Variables for Security

```bash
# Production environment variables
export DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/muza"
export ADMIN_PASSWORD="secure-random-password"
export DISABLE_PUBLIC_ADMIN=true
```

## Monitoring and Alerts

Set up CloudWatch alerts for unauthorized access attempts:

```yaml
Type: AWS::CloudWatch::Alarm
Properties:
  AlarmName: UnauthorizedAdminAccess
  MetricName: 4xxError
  Namespace: AWS/ApplicationELB
  Statistic: Sum
  Period: 300
  EvaluationPeriods: 1
  Threshold: 5
  ComparisonOperator: GreaterThanThreshold
  Dimensions:
    - Name: LoadBalancer
      Value: !Ref AdminUILoadBalancer
```

## Best Practices

1. **Network Segmentation**: Keep admin UI in private subnet
2. **Multi-Factor Authentication**: Consider integrating with AWS Cognito
3. **Session Management**: Implement secure session handling
4. **Audit Logging**: Log all admin actions
5. **Regular Security Reviews**: Monitor access patterns
6. **Principle of Least Privilege**: Only grant necessary permissions

## Testing VPN Access

```bash
# Test from VPN
curl -u admin:password http://internal-admin-ui:5002/health

# Should fail from public internet
curl http://public-admin-ui:5002/health  # Should return 403 or timeout
```
