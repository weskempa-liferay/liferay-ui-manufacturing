# Liferay Client Extensions Development Best Practices

This guide provides the core architectural, packaging, configuration, and deployment principles for building, grouping, and managing Liferay Client Extensions in a Liferay Workspace.

---

## 1. Directory Structure & Layout

Client extensions must reside inside the workspace's `client-extensions/` directory, typically categorized by type or feature area. 

### Standard Project Layout
Each client extension project is defined in its own folder containing a `client-extension.yaml` configuration file and its build resources:

```text
[workspace-root]/
├── client-extensions/
│   └── [category]/
│       └── [project-name]/
│           ├── client-extension.yaml
│           ├── package.json (Optional, for front-end JS projects)
│           ├── src/         (Source files, if applicable)
│           └── build/       (Build outputs)
```

---

## 2. Defining Client Extensions (`client-extension.yaml`)

Every project folder must contain exactly one `client-extension.yaml` file defining one or more client extensions.

### YAML Schema Properties
- **`name`**: The display name of the client extension as it appears in the Liferay instance's UI.
- **`type`**: The type of client extension (e.g., `customElement`, `themeCSS`, `batch`, `oAuthUserAgent`, etc.). This dictates how Liferay handles the deployment.
- **`dxp.lxc.liferay.com.virtualInstanceId`**: (Optional) Virtual instance ID where it should deploy. *Note: Incompatible with Liferay PaaS.*

### Custom Element (React / JS) Example
```yaml
assemble:
  - from: build/static
    into: static
clinical-site-locator:
  friendlyURLMapping: clinical-site-locator
  htmlElementName: clinical-site-locator
  instanceable: false
  name: Clinical Site Locator
  portletCategoryName: category.client-extensions
  type: customElement
  urls:
    - index.*.js
    - index.*.css
  useESM: true
```

---

## 3. The `assemble` Block (Packaging Configuration)

The `assemble` block configures how compiled files are collected and structured inside the built LUFFA (Liferay Universal File Format Archive) zip.

### Core Rules
- **Automatic NPM Builds**: If a project directory contains a `package.json` with a `build` script, Liferay's build tooling will run this script *before* the assembly file-copying begins.
- **Assemble Properties**:
  - **`from`**: Source directory in the project to copy files from.
  - **`include`**: A glob string or an array of glob strings defining a subset of files to copy. If omitted, copies everything recursively (`**/*`).
  - **`into`**: Target folder inside the LUFFA archive:
    - **`static`**: Target folder for all frontend client extension resources (e.g. JavaScript, CSS, images).
    - **`batch`**: Target folder for all batch engine configuration JSONs.
  - **`fromTask`**: Triggers execution of a specific Gradle task (like `bootJar` or a custom Gradle `Exec` task) before assembly, using its output as the assembly source.

### Multi-Directory Assembly Example
```yaml
assemble:
  - from: build/css
    include: "*.css"
    into: static/css
  - from: build/js
    include: "*.js"
    into: static/js
  - from: assets
    into: static/assets
```

---

## 4. Grouping Client Extensions

Multiple client extensions defined in the same `client-extension.yaml` file are built and packaged into a single LUFFA zip file. However, they share a Docker container workload (if deployed to Cloud), which enforces strict grouping compatibility rules:

### Compatibility Grid
- **Allowed Groupings**:
  - Client extensions of the same type (e.g., multiple batch configurations).
  - Configuration client extensions combined with Batch client extensions.
  - Configuration client extensions combined with Frontend client extensions.
  - Configuration client extensions combined with Microservice client extensions.
- **Forbidden Groupings**:
  - Mixing Frontend client extensions with Microservice client extensions.
  - Mixing Batch client extensions with Microservice client extensions.
  
> [!WARNING]
> Building a project with an incompatible grouping will result in build-time validation errors.

---

## 5. Built LUFFA Archive Structure

When built, the project is packaged into a `dist/[project-name].zip` file (LUFFA) matching this layout:

```text
.
├── batch/
│   └── **/*.batch-engine-data.json
├── *.client-extension-config.json
├── Dockerfile
├── LCP.json
├── static/
│   └── **/*
├── WEB-INF/
│   └── liferay-plugin-package.properties
└── [microservice resources]
```

### Generated Configuration Files
- **`*.client-extension-config.json`**: An OSGi configuration file generated automatically by the workspace Gradle plugin from your `client-extension.yaml` definitions.
- **`Dockerfile` & `LCP.json`**: Generated automatically for Batch, Configuration, and Frontend extensions. Custom Microservice projects must provide their own `Dockerfile` and `LCP.json` at the project root.

---

## 6. Development & Deployment Workflows

Deployment methods vary depending on the target hosting environment:

### A. Liferay SaaS Deployment
1. Navigate to the client extension project (or the `client-extensions/` root directory) and compile:
   ```bash
   ../gradlew clean build
   ```
2. Deploy the built archive to the cloud environment:
   ```bash
   lcp deploy --extension dist/[project-name].zip
   ```
   *Note: If a bulk deployment of many extensions fails, deploy them individually or in smaller batches to avoid temporary resource limits.*

### B. Liferay PaaS Deployment
1. Commit the client extension code and its `client-extension.yaml` file into your Liferay Workspace Git repository.
2. Push your changes to trigger the dedicated **client extension CI pipeline** (which builds them independently of core Liferay DXP services).
3. Deploy the resulting build from the PaaS Console **Builds** page.
   *Note: Non-production environments require configuring the web server to bypass basic authentication for client extensions to communicate.*

### C. Self-Hosted DXP Deployment
- **Workspace-wide automated deploy**:
  ```bash
  ../gradlew clean distBundleZip
  ```
- **Manual deploy**:
  Run `../gradlew clean build` and copy the generated `.zip` files from `dist/` into the server's directory:
  `[Liferay Home]/osgi/client-extensions/`

---

## 7. Context-Sensitive Information (Routes)

Client extensions must remain portable. Never hard-code URLs, domains, or credentials. Use the platform's routes-based environment configuration mapping (Kubernetes configMap pattern) to fetch details at runtime:

### Environment Variables
- **`LIFERAY_ROUTES_DXP`**: Directory path containing files named after their metadata keys for the DXP virtual instance (e.g. `com.liferay.lxc.dxp.main.domain`).
- **`LIFERAY_ROUTES_CLIENT_EXTENSION`**: Directory path containing configuration metadata for the client extension project (e.g. OAuth settings).

### Self-Hosted Default Paths
During Gradle execution tasks (`Exec`, `JavaExec`, `NodeExec`), default routes are automatically mounted:
- `LIFERAY_ROUTES_DXP` defaults to: `[Liferay Home]/routes/default/dxp`
- `LIFERAY_ROUTES_CLIENT_EXTENSION` defaults to: `[Liferay Home]/routes/default/[Project Name]`
