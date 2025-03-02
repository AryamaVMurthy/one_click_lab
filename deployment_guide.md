I'll update the deployment guide to include comprehensive Next.js and CI/CD integration for lab deployments, making sure all the information is contained within the document.

```markdown
# Lab Deployment Guide with Next.js Static Export

This document outlines how to leverage Next.js's built-in static site generation capabilities to deploy interactive lab experiences to AWS S3/CloudFront, including CI/CD automation for streamlined deployments.

## Table of Contents
1. [Next.js Static Export Overview](#nextjs-static-export-overview)
2. [Implementation Strategy](#implementation-strategy)
3. [Lab Viewer App Setup](#lab-viewer-app-setup)
4. [AWS Integration](#aws-integration)
5. [Backend API Implementation](#backend-api-implementation)
6. [Frontend Implementation](#frontend-implementation) 
7. [Asset Management](#asset-management)
8. [Performance Optimization](#performance-optimization)
9. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
10. [Versioning and Updates](#versioning-and-updates)
11. [Monitoring and Analytics](#monitoring-and-analytics)

---

## Next.js Static Export Overview

Next.js provides a powerful feature called Static Site Generation (SSG) which can pre-render pages at build time. This is perfect for our use case where we want to:

1. Create standalone, interactive HTML versions of labs
2. Deploy these versions to AWS S3
3. Ensure they work without requiring a backend server

### Key Benefits

- **Zero Server Dependencies**: Exported labs work without backend servers
- **Improved Performance**: Pre-rendered HTML loads instantly
- **SEO-Friendly**: Content is already in the HTML
- **Cost-Effective Hosting**: Static files are cheaper to host
- **Security**: No server-side vulnerabilities

---

## Implementation Strategy

### 1. Create a Standalone Lab Viewer App

Rather than generating HTML on the backend, we'll create a dedicated Next.js application that:

- Contains only the lab viewing functionality
- Can be statically exported
- Embeds all lab data directly in the build
- Preserves all interactivity via client-side JavaScript

### 2. Export Process Flow

When a user clicks "Deploy Lab" in the main application:

1. Backend sends the lab data to a dedicated Next.js Lab Viewer app
2. Next.js builds the app with this specific lab data
3. Next.js exports static HTML/JS/CSS files using `next export`
4. These files are uploaded to S3
5. A unique URL for this lab version is generated and returned

---

## Lab Viewer App Setup

### 1. Create the Lab Viewer Next.js App

```bash
npx create-next-app@latest lab-viewer --typescript
cd lab-viewer
npm install axios react-markdown
```

 

### 2\. Configure Next.js for Static Export

 

In `next.config.js`:

 

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,  // Helps with S3 paths
  images: {
    unoptimized: true   // Required for static export
  },
  env: {
    LAB_VERSION: process.env.LAB_VERSION || 'development'
  }
};

module.exports = nextConfig;
```

 

### 3\. Lab Viewer App Structure

 

```
lab-viewer/
├── pages/
│   └── index.js         # Main lab viewer component
├── components/
│   ├── LabContent.js    # Lab content renderer
│   ├── Navigation.js    # Lab navigation
│   ├── ModuleRenderer.js # Individual module renderer
│   └── QuizModule.js    # Interactive quiz component
├── styles/
│   └── globals.css      # Global styles
├── public/
│   └── assets/          # For lab-specific assets
├── next.config.js       # Next.js config with export settings
└── lab-data.json        # Lab data (injected during build)
```

 

### 4\. Lab Data Injection

 

Create a script to inject lab data during the build process:

 

```javascript
// scripts/injectLabData.js
const fs = require('fs');

// Get lab data from arguments or environment variable
const labData = process.argv[2] || process.env.LAB_DATA;
if (!labData) {
  console.error('No lab data provided');
  process.exit(1);
}

try {
  // Parse and validate lab data
  const parsedData = JSON.parse(labData);
  
  // Write to lab-data.json
  fs.writeFileSync('./lab-data.json', JSON.stringify(parsedData, null, 2));
  console.log('Lab data injected successfully');
} catch (error) {
  console.error('Failed to process lab data:', error);
  process.exit(1);
}
```

 

Add this script to package.json:

 

```json
"scripts": {
  "inject-data": "node scripts/injectLabData.js",
  "build-lab": "npm run inject-data && npm run build",
  "export-lab": "npm run build-lab && npx next export -o out"
}
```

 

---

 

## AWS Integration

 

### 1\. S3 Bucket Setup

 

Create an S3 bucket with appropriate permissions and CORS settings:

 

```json
{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET"],
  "AllowedOrigins": ["*"],
  "ExposeHeaders": [],
  "MaxAgeSeconds": 3000
}
```

 

### 2\. Folder Structure in S3

 

```
bucket-name/
└── labs/
    └── {lab-id}/
        ├── latest/        # Points to the latest version
        └── versions/
            └── {version}/
                ├── index.html
                ├── _next/  
                │   └── ...  # All Next.js static assets
                └── assets/  # Lab-specific assets
```

 

### 3\. CloudFront Configuration

 

1. Create a CloudFront distribution:

   - Origin: Your S3 bucket
   - Origin Access Identity: Create new OAI and restrict bucket access to CloudFront
   - Default root object: `index.html`
   - Cache policy: Managed-CachingOptimized
   - Price class: Choose based on your geographic needs
   - Alternate domain names: Add your custom domain if needed
   - SSL certificate: Custom SSL or ACM certificate
   - Default behavior: Redirect HTTP to HTTPS

2. Configure custom error responses:

   - For 403 and 404 errors, return `/index.html` with 200 status code
   - This enables client-side routing for direct deep links

3. Set up cache invalidation automation:

   - After each deployment, create invalidation for `/labs/{lab-id}/*`

 

---

 

## Backend API Implementation

 

### Deploy Lab Endpoint

 

```python
@router.post("/api/v1/labs/{lab_id}/deploy")
async def deploy_lab(lab_id: str, current_user: User = Depends(get_current_user)):
    # 1. Get lab data and validate
    lab = await get_lab_by_id(lab_id)
    if not has_permission_to_deploy(current_user, lab):
        raise HTTPException(status_code=403, detail="No permission to deploy this lab")
    
    # 2. Create a version identifier
    version = f"v{int(time.time())}"
    export_dir = f"/tmp/lab-export-{lab_id}-{version}"
    
    # 3. Process lab contents for deployment
    processed_lab = process_lab_assets(lab, version)
    
    # 4. Inject lab data into Next.js app and build it
    lab_viewer_dir = settings.lab_viewer_app_path
    result = subprocess.run([
        "npm", "run", "inject-data", json.dumps(processed_lab)
    ], cwd=lab_viewer_dir, check=True)
    
    # 5. Build and export the Next.js app
    result = subprocess.run([
        "npm", "run", "export-lab", "--", "-o", export_dir
    ], cwd=lab_viewer_dir, check=True)
    
    # 6. Upload to S3
    version_path = f"labs/{lab_id}/versions/{version}/"
    latest_path = f"labs/{lab_id}/latest/"
    
    # Upload all files from the export directory
    await upload_directory_to_s3(export_dir, version_path)
    await upload_directory_to_s3(export_dir, latest_path)
    
    # 7. Create CloudFront invalidation if needed
    if settings.cloudfront_distribution_id:
        await invalidate_cloudfront_paths([
            f"/labs/{lab_id}/versions/{version}/*", 
            f"/labs/{lab_id}/latest/*"
        ])
    
    # 8. Generate and return URL
    base_url = settings.lab_hosting_domain or f"{settings.s3_bucket_name}.s3-website-{settings.aws_region}.amazonaws.com"
    deployment_url = f"https://{base_url}/labs/{lab_id}/latest/"
    
    # 9. Update lab deployment information in database
    await update_lab_deployment_info(lab_id, version, deployment_url)
    
    return {
        "success": True,
        "data": {
            "deploymentUrl": deployment_url,
            "deployedVersion": version
        }
    }
```

 

### Helper Functions for Asset Management

 

```python
def process_lab_assets(lab, version):
    """Process lab assets for deployment:
    1. Download external images
    2. Store local copies in assets folder
    3. Update URLs in lab content
    """
    processed_lab = copy.deepcopy(lab)
    assets_dir = f"/tmp/lab-assets-{lab.id}-{version}"
    os.makedirs(assets_dir, exist_ok=True)
    
    # Process each module
    for section in processed_lab.sections:
        for module in section.modules:
            if module.type == 'image':
                # Download and process images
                asset_path = download_and_store_asset(module.url, assets_dir)
                module.url = f"/assets/{asset_path}"
            elif module.type == 'text':
                # Extract and process images in HTML content
                module.content = process_html_content(module.content, assets_dir)
    
    return processed_lab
```

 

### AWS Upload Functions

 

```python
async def upload_directory_to_s3(local_dir, s3_prefix):
    """Upload directory contents to S3"""
    tasks = []
    
    for root, _, files in os.walk(local_dir):
        for file in files:
            local_path = os.path.join(root, file)
            rel_path = os.path.relpath(local_path, local_dir)
            s3_key = f"{s3_prefix}{rel_path}"
            
            content_type = mimetypes.guess_type(file)[0] or "application/octet-stream"
            
            tasks.append(
                s3_client.put_object(
                    Bucket=settings.s3_bucket_name,
                    Key=s3_key,
                    Body=open(local_path, 'rb'),
                    ContentType=content_type,
                    CacheControl=get_cache_control(file)
                )
            )
    
    await asyncio.gather(*tasks)

def get_cache_control(filename):
    """Determine cache control header based on file type"""
    if filename.endswith('.html'):
        return "public, max-age=60"  # 1 minute for HTML files
    elif any(filename.endswith(ext) for ext in ['.js', '.css']):
        return "public, max-age=86400"  # 1 day for JS/CSS
    else:
        return "public, max-age=604800"  # 1 week for other assets
```

 

---

 

## Frontend Implementation

 

### 1\. Main Page Component (index.js)

 

```jsx
import { useState, useEffect } from 'react';
import LabContent from '../components/LabContent';
import Navigation from '../components/Navigation';
import labData from '../lab-data.json';

export default function LabViewer() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentModule, setCurrentModule] = useState(0);
  const [progress, setProgress] = useState({});
  
  // Load progress from localStorage on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProgress = localStorage.getItem(`lab-progress-${labData.id}`);
      if (savedProgress) {
        try {
          setProgress(JSON.parse(savedProgress));
        } catch (e) {
          console.error('Failed to parse saved progress');
        }
      }
    }
  }, []);
  
  // Save progress as it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(progress).length > 0) {
      localStorage.setItem(`lab-progress-${labData.id}`, JSON.stringify(progress));
    }
  }, [progress]);
  
  // Mark module as completed
  const markModuleComplete = (moduleId) => {
    setProgress(prev => ({
      ...prev,
      [moduleId]: true
    }));
  };
  
  // Navigation functionality
  const navigateToModule = (sectionIndex, moduleIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentModule(moduleIndex);
  };
  
  return (
    <div className="lab-container">
      <Navigation 
        lab={labData}
        currentSection={currentSection}
        currentModule={currentModule}
        progress={progress}
        onNavigate={navigateToModule}
      />
      <LabContent 
        lab={labData}
        currentSection={currentSection}
        currentModule={currentModule}
        onComplete={markModuleComplete}
        onNavigateNext={() => {/* Navigation logic */}}
        onNavigatePrev={() => {/* Navigation logic */}}
      />
    </div>
  );
}
```

 

### 2\. Add Additional Components

 

Create the remaining components following similar structure to your existing ModuleRenderer and LabPreview components, but optimized for static use:

 

- Navigation.js - Sidebar navigation
- LabContent.js - Main content display
- ModuleRenderer.js - Module-specific rendering
- QuizModule.js - Interactive quiz functionality

 

---

 

## Asset Management

 

### 1\. Image Optimization and Handling

 

During the lab processing step, implement:

 

1. Asset discovery: Scan HTML content for embedded images and other media
2. Asset downloading: Fetch external assets and store locally
3. Path updating: Update content to reference local assets with relative paths
4. Asset optimization: Compress images to reduce file sizes

 

```python
def process_html_content(html_content, assets_dir):
    """Extract images from HTML content and replace with local paths"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Process all images
    for img in soup.find_all('img'):
        if img.get('src'):
            src = img['src']
            if is_external_url(src):
                # Download external image
                asset_path = download_and_store_asset(src, assets_dir)
                # Replace with local path
                img['src'] = f"/assets/{asset_path}"
    
    # Process all videos/iframes similarly
    
    return str(soup)
```

 

### 2\. Video Embedding

 

For video content:

 

1. For YouTube/Vimeo: Keep the embed iframe but ensure it uses HTTPS
2. For uploaded videos: Download and provide multiple formats with a HTML5 video player

 

---

 

## Performance Optimization

 

### 1\. Asset Optimization

 

Compress and optimize all assets:

 

```python
def optimize_image(image_path):
    """Optimize image file size"""
    from PIL import Image
    import io
    
    img = Image.open(image_path)
    
    # Resize if too large
    max_size = 1200
    if img.width > max_size or img.height > max_size:
        img.thumbnail((max_size, max_size), Image.LANCZOS)
    
    # Save with optimized settings
    output = io.BytesIO()
    
    if image_path.lower().endswith(('.jpg', '.jpeg')):
        img.save(output, format='JPEG', quality=85, optimize=True)
    elif image_path.lower().endswith('.png'):
        img.save(output, format='PNG', optimize=True)
    elif image_path.lower().endswith('.webp'):
        img.save(output, format='WEBP', quality=85)
    else:
        # For other formats, save as is
        return
    
    # Write the optimized image back
    with open(image_path, 'wb') as f:
        f.write(output.getvalue())
```

 

### 2\. JavaScript Minimization

 

Ensure Next.js production build optimizations are enabled:

 

```javascript
// next.config.js
const nextConfig = {
  // ...existing config...
  
  // Enable minification
  swcMinify: true,
  
  // Configure Terser for additional optimizations
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.optimization.minimize = true;
    }
    return config;
  }
};
```

 

### 3\. Lazy Loading and Code Splitting

 

Implement in the Lab Viewer app:

 

```jsx
// Use Next.js dynamic imports for heavy components
import dynamic from 'next/dynamic';

const QuizModule = dynamic(() => import('../components/QuizModule'), {
  loading: () => <p>Loading quiz...</p>
});

// Use native lazy loading for images
<img src="/assets/image.jpg" loading="lazy" alt="Description" />
```

 

---

 

## CI/CD Pipeline Setup

 

### 1\. GitHub Actions Pipeline

 

Create a GitHub Actions workflow file for automatic deployments:

 

```yaml
name: Deploy Lab

on:
  repository_dispatch:
    types: [deploy-lab]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
        
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install lab-viewer dependencies
        run: cd lab-viewer && npm install
        
      - name: Process lab data
        id: process-lab
        run: |
          LAB_DATA='${{ github.event.client_payload.lab_data }}'
          LAB_ID='${{ github.event.client_payload.lab_id }}'
          VERSION='${{ github.event.client_payload.version }}'
          echo $LAB_DATA > lab-viewer/lab-data.json
          echo "::set-output name=lab_id::${LAB_ID}"
          echo "::set-output name=version::${VERSION}"
        
      - name: Build and export lab
        run: cd lab-viewer && npm run export-lab
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
        
      - name: Deploy to S3
        run: |
          LAB_ID="${{ steps.process-lab.outputs.lab_id }}"
          VERSION="${{ steps.process-lab.outputs.version }}"
          aws s3 sync lab-viewer/out/ s3://${{ secrets.S3_BUCKET }}/labs/${LAB_ID}/versions/${VERSION}/ --delete
          aws s3 sync lab-viewer/out/ s3://${{ secrets.S3_BUCKET }}/labs/${LAB_ID}/latest/ --delete
        
      - name: Invalidate CloudFront
        if: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID != '' }}
        run: |
          LAB_ID="${{ steps.process-lab.outputs.lab_id }}"
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/labs/${LAB_ID}/versions/*" "/labs/${LAB_ID}/latest/*"
        
      - name: Notify backend about deployment completion
        run: |
          curl -X POST ${{ github.event.client_payload.callback_url }} \
            -H "Content-Type: application/json" \
            -d '{"success":true,"lab_id":"${{ steps.process-lab.outputs.lab_id }}","version":"${{ steps.process-lab.outputs.version }}"}'
```

 

### 2\. Backend Trigger for CI/CD Pipeline

 

Modify the backend deploy endpoint to trigger GitHub Actions:

 

```python
async def trigger_github_actions_deployment(lab_id, lab_data, version):
    """Trigger GitHub Actions deployment workflow"""
    url = f"https://api.github.com/repos/{settings.github_repo_owner}/{settings.github_repo_name}/dispatches"
    
    # Create callback URL for deployment completion notification
    callback_url = f"{settings.api_base_url}/api/v1/labs/{lab_id}/deployment-callback"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {settings.github_token}"
    }
    
    payload = {
        "event_type": "deploy-lab",
        "client_payload": {
            "lab_id": lab_id,
            "lab_data": lab_data,
            "version": version,
            "callback_url": callback_url
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        return response.status_code == 204  # GitHub API returns 204 No Content on success
```

 

### 3\. Deployment Callback Endpoint

 

```python
@router.post("/api/v1/labs/{lab_id}/deployment-callback")
async def deployment_callback(lab_id: str, data: dict):
    """Handle callback from CI/CD pipeline"""
    if data.get("success"):
        # Update lab status in database
        await update_lab_deployment_status(
            lab_id=lab_id,
            version=data.get("version"),
            status="completed"
        )
        return {"success": True}
    else:
        # Handle deployment failure
        await update_lab_deployment_status(
            lab_id=lab_id,
            version=data.get("version"),
            status="failed",
            error=data.get("error")
        )
        return {"success": False, "error": data.get("error")}
```

 

---

 

## Versioning and Updates

 

### 1\. Version Management in Database

 

Track versions and deployment history in MongoDB:

 

```json
{
  "deploymentUrls": {
    "latest": "https://labs.example.com/labs/abc123/latest/",
    "versions": [
      {
        "version": "v1628784000",
        "url": "https://labs.example.com/labs/abc123/versions/v1628784000/",
        "deployedAt": "2023-08-13T15:30:00Z",
        "status": "completed"
      },
      {
        "version": "v1628697600",
        "url": "https://labs.example.com/labs/abc123/versions/v1628697600/",
        "deployedAt": "2023-08-12T15:30:00Z",
        "status": "completed" 
      }
    ]
  }
}
```

 

### 2\. Version Rollback API

 

Add a rollback endpoint:

 

```python
@router.post("/api/v1/labs/{lab_id}/rollback/{version}")
async def rollback_lab_version(lab_id: str, version: str):
    """Roll back to a previous version"""
    # Verify version exists
    lab = await get_lab_by_id(lab_id)
    version_exists = False
    
    for v in lab.get("deploymentUrls", {}).get("versions", []):
        if v.get("version") == version:
            version_exists = True
            break
    
    if not version_exists:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")
    
    # Copy version files to latest
    source_path = f"labs/{lab_id}/versions/{version}/"
    dest_path = f"labs/{lab_id}/latest/"
    
    await sync_s3_directories(
        bucket=settings.s3_bucket_name,
        source_prefix=source_path,
        dest_prefix=dest_path
    )
    
    # Update database
    await update_lab_latest_version(lab_id, version)
    
    # Invalidate CloudFront
    if settings.cloudfront_distribution_id:
        await invalidate_cloudfront_paths([f"/labs/{lab_id}/latest/*"])
    
    return {
        "success": True,
        "data": {
            "message": f"Successfully rolled back to version {version}"
        }
    }
```

 

---

 

## Monitoring and Analytics

 

### 1\. Embedded Analytics

 

Add Google Analytics or custom analytics to deployed labs:

 

```jsx
// In lab-viewer components, add analytics snippet
useEffect(() => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_module', {
      lab_id: labData.id,
      module_id: currentModule.id,
      module_type: currentModule.type
    });
  }
}, [currentModule]);
```

 

### 2\. Deployment Monitoring

 

Implement deployment monitoring for CI/CD:

 

```python
async def track_deployment(lab_id, version, status, metadata=None):
    """Track deployment status and metrics"""
    deployment_log = {
        "lab_id": lab_id,
        "version": version,
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": metadata or {}
    }
    
    await db.deployment_logs.insert_one(deployment_log)
    
    # Send notification if needed
    if status == "completed":
        await send_deployment_notification(lab_id, version, "success")
    elif status == "failed":
        await send_deployment_notification(lab_id, version, "failure", metadata.get("error"))
```

 

### 3\. Usage Statistics Dashboard

 

Create an admin dashboard to view:

 

- Number of lab deployments
- Lab view statistics
- User progression through labs
- Quiz completion rates

 

This comprehensive guide provides everything you need to implement a robust lab deployment system using Next.js static exports and a complete CI/CD pipeline, all delivered through AWS S3 and CloudFront for optimal performance and scalability.

 

 