# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying my-api.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Ingress controller (nginx recommended)
- Storage provisioner

## Quick Start

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/my-api
```

## Resources

### Application
- **Deployment**: `deployment.yml` - Main application deployment
- **Service**: `service.yml` - ClusterIP service for internal access
- **ConfigMap**: `configmap.yml` - Application configuration
- **Secret**: `secret.yml` - Sensitive data (change default values!)
- **Ingress**: `ingress.yml` - External access configuration
- **HPA**: `hpa.yml` - Horizontal Pod Autoscaler

### Database (postgresql)
- **Deployment**: `postgresql-deployment.yml`
- **Service**: `postgresql-service.yml`
- **PVC**: `postgresql-pvc.yml`
- **Secret**: `postgresql-secret.yml`


## Important Notes

⚠️ **Before deploying to production:**

1. **Update Secrets**: Change all passwords in `secret.yml` and `*-secret.yml`
2. **Update Ingress**: Change hostname in `ingress.yml` to your domain
3. **Configure Storage**: Set appropriate `storageClassName` in PVCs
4. **Review Resources**: Adjust CPU/memory limits based on your needs
5. **Enable TLS**: Configure TLS certificates for Ingress

## Deployment Steps

### 1. Create Namespace (Optional)
```bash
kubectl create namespace my-api
kubectl config set-context --current --namespace=my-api
```

### 2. Apply Secrets (Update First!)
```bash
kubectl apply -f k8s/secret.yml
kubectl apply -f k8s/postgresql-secret.yml
```

### 3. Apply ConfigMaps
```bash
kubectl apply -f k8s/configmap.yml
```

### 4. Create Storage
```bash
kubectl apply -f k8s/postgresql-pvc.yml
```

### 5. Deploy Database
```bash
kubectl apply -f k8s/postgresql-deployment.yml
kubectl apply -f k8s/postgresql-service.yml
```

### 6. Deploy Application
```bash
kubectl apply -f k8s/deployment.yml
kubectl apply -f k8s/service.yml
kubectl apply -f k8s/ingress.yml
kubectl apply -f k8s/hpa.yml
```

### 7. Verify Deployment
```bash
kubectl get all
kubectl describe deployment my-api
kubectl logs -f deployment/my-api
```

## Scaling

Manual scaling:
```bash
kubectl scale deployment my-api --replicas=5
```

Auto-scaling is configured via HPA (2-10 replicas).

## Updating

Rolling update:
```bash
kubectl set image deployment/my-api my-api=my-api:v2
kubectl rollout status deployment/my-api
```

Rollback:
```bash
kubectl rollout undo deployment/my-api
```

## Troubleshooting

```bash
# Check pod status
kubectl get pods

# View pod logs
kubectl logs <pod-name>

# Describe pod for events
kubectl describe pod <pod-name>

# Execute commands in pod
kubectl exec -it <pod-name> -- /bin/sh

# Check resource usage
kubectl top pods
kubectl top nodes
```

## Clean Up

```bash
kubectl delete -f k8s/
```
