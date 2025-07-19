# ☸️ Kubernetes Deployment

**Simple K8s deployment for QA-API with secrets and service configuration**

## 🚀 Quick Deploy

```bash
# 1. Configure secrets (base64 encode your values)
kubectl apply -f k8s/secret.yaml

# 2. Deploy application
kubectl apply -f k8s/deployment.yaml

# 3. Expose service
kubectl apply -f k8s/service.yaml
```

## 🔧 Configuration

### Secrets Setup

```bash
# Encode your secrets
echo -n 'your-secret-value' | base64

# Add to secret.yaml
```

### Service Types

- **ClusterIP** (default): Internal cluster access
- **NodePort**: External access via node port
- **LoadBalancer**: Cloud provider load balancer

## 📋 Requirements

- ✅ Docker image in accessible registry
- ✅ Base64 encoded secrets
- ✅ Kubernetes cluster access

---

_For production: Add Ingress, ConfigMap, and persistent storage for MongoDB/Redis_
