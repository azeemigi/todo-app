# Skill: Maven Build Standards

**Scope:** All `pom.xml` files in the project (parent, todo-api, todo-ui)
**Stack:** Maven 3.9.x, Java 25 LTS, Spring Boot 3.5.14, Angular 22, frontend-maven-plugin

---

## Multi-Module Structure

```
todo-app/                        # Parent POM (packaging: pom)
├── pom.xml                      # Parent -- defines modules, shared properties, dependency management
├── todo-api/                    # Backend module (packaging: jar)
│   └── pom.xml                  # Spring Boot app with spring-boot-maven-plugin
└── todo-ui/                     # Frontend module (packaging: pom)
    └── pom.xml                  # Angular build via frontend-maven-plugin
```

---

## Parent POM Pattern

The parent POM's responsibilities:
- Define `<modules>` list (todo-ui builds BEFORE todo-api so the Angular output is ready for resource copying)
- Define shared `<properties>` (Java version, Spring Boot version, encoding)
- Define `<dependencyManagement>` for consistent dependency versions across modules
- Do NOT define `<dependencies>` at the parent level (each module declares its own)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>nz.co.todoapp</groupId>
    <artifactId>todo-app</artifactId>
    <version>0.1.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <name>TODO App</name>
    <description>Full-stack TODO application -- Angular 22 + Spring Boot 3.5</description>

    <!-- IMPORTANT: todo-ui MUST come before todo-api in module order -->
    <modules>
        <module>todo-ui</module>
        <module>todo-api</module>
    </modules>

    <properties>
        <java.version>25</java.version>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <spring-boot.version>3.5.14</spring-boot.version>
        <node.version>v24.16.0</node.version>
        <npm.version>11.13.0</npm.version>
        <frontend-maven-plugin.version>1.15.1</frontend-maven-plugin.version>
    </properties>
</project>
```

---

## Backend Module (todo-api/pom.xml)

The backend module:
- Uses `spring-boot-starter-parent` as parent OR imports Spring Boot BOM via `<dependencyManagement>`
- Declares its own dependencies (web, validation, test)
- Includes `spring-boot-maven-plugin` for executable JAR and `mvn spring-boot:run`
- Copies Angular build output into `target/classes/static/` via `maven-resources-plugin`

### Key dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Resource copying (Angular output into Spring Boot static)

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <executions>
        <execution>
            <id>copy-angular-build</id>
            <phase>generate-resources</phase>
            <goals>
                <goal>copy-resources</goal>
            </goals>
            <configuration>
                <outputDirectory>${project.build.directory}/classes/static</outputDirectory>
                <resources>
                    <resource>
                        <!-- Angular 22 outputs to dist/<project-name>/browser/ -->
                        <directory>${project.parent.basedir}/todo-ui/dist/todo-ui/browser</directory>
                        <filtering>false</filtering>
                    </resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**IMPORTANT**: The Angular output path changed in Angular 17+. The build output goes to `dist/<project-name>/browser/` (not `dist/<project-name>/` directly). Verify the actual output path after the first `ng build` and adjust the resource directory accordingly.

---

## Frontend Module (todo-ui/pom.xml)

The frontend module:
- Uses `pom` packaging (it does not produce a JAR)
- Uses `frontend-maven-plugin` to install Node/npm and run Angular CLI commands
- Binds to Maven lifecycle phases so `mvn clean verify` runs the Angular build and tests

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>nz.co.todoapp</groupId>
        <artifactId>todo-app</artifactId>
        <version>0.1.0-SNAPSHOT</version>
    </parent>

    <artifactId>todo-ui</artifactId>
    <packaging>pom</packaging>
    <name>TODO App - UI</name>

    <build>
        <plugins>
            <plugin>
                <groupId>com.github.eirslett</groupId>
                <artifactId>frontend-maven-plugin</artifactId>
                <version>${frontend-maven-plugin.version}</version>
                <configuration>
                    <nodeVersion>${node.version}</nodeVersion>
                    <npmVersion>${npm.version}</npmVersion>
                    <workingDirectory>${project.basedir}</workingDirectory>
                    <installDirectory>${project.build.directory}</installDirectory>
                </configuration>
                <executions>
                    <!-- 1. Install Node and npm -->
                    <execution>
                        <id>install-node-and-npm</id>
                        <goals><goal>install-node-and-npm</goal></goals>
                        <phase>initialize</phase>
                    </execution>
                    <!-- 2. npm install -->
                    <execution>
                        <id>npm-install</id>
                        <goals><goal>npm</goal></goals>
                        <phase>initialize</phase>
                        <configuration>
                            <arguments>install</arguments>
                        </configuration>
                    </execution>
                    <!-- 3. ng test (runs during Maven test phase) -->
                    <execution>
                        <id>ng-test</id>
                        <goals><goal>npm</goal></goals>
                        <phase>test</phase>
                        <configuration>
                            <arguments>run test:ci</arguments>
                        </configuration>
                    </execution>
                    <!-- 4. ng build (runs during Maven compile phase) -->
                    <execution>
                        <id>ng-build</id>
                        <goals><goal>npm</goal></goals>
                        <phase>compile</phase>
                        <configuration>
                            <arguments>run build</arguments>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### Required npm scripts in todo-ui/package.json

```json
{
  "scripts": {
    "build": "ng build --configuration=production",
    "test": "ng test",
    "test:ci": "ng test --watch=false --browsers=ChromeHeadless --code-coverage"
  }
}
```

---

## Build Lifecycle Mapping

When you run `mvn clean verify`, here is what happens in order:

| Phase | todo-ui (frontend) | todo-api (backend) |
|---|---|---|
| `initialize` | Install Node/npm, run `npm install` | -- |
| `compile` | Run `ng build --configuration=production` | Compile Java sources |
| `generate-resources` | -- | Copy Angular output to `target/classes/static/` |
| `test` | Run `ng test --watch=false --browsers=ChromeHeadless` | Run JUnit 5 tests via Surefire |
| `package` | -- | Package JAR via spring-boot-maven-plugin |
| `verify` | -- | (Integration tests would run here via Failsafe, if any) |

---

## Properties and Version Management Rules

1. **All dependency versions** go in `<properties>` or `<dependencyManagement>`, never hardcoded in `<dependency>` blocks
2. **Spring Boot managed dependencies** (Jackson, SLF4J, JUnit, Mockito) inherit versions from the Spring Boot BOM. Do not override unless you have a specific reason
3. **Plugin versions** must be explicit (never rely on Maven's default plugin versions)
4. **Encoding** is always UTF-8

---

## Build Rules

1. **`mvn clean verify` must always pass.** This is the gate. If it fails, stop and fix before doing anything else
2. **Module order matters**: `todo-ui` must be listed before `todo-api` in the parent POM so the Angular build output is available for resource copying
3. **Never skip tests**: do not add `-DskipTests` to any POM configuration. Tests can be skipped only via explicit command-line flag by the user
4. **Keep the parent POM minimal**: it defines modules, properties, and dependency management. It does NOT declare concrete dependencies or plugin executions
5. **Use `${project.parent.basedir}`** to reference cross-module paths (e.g. Angular build output)
6. **The frontend-maven-plugin downloads its own Node/npm** into `target/`. It does NOT use the system-installed Node. This ensures reproducible builds regardless of the developer's local Node version

---

## Running the Application

```bash
# Full build first
mvn clean verify

# Start (serves Angular static files + API on port 8080)
mvn spring-boot:run -pl todo-api
```

For development with hot-reload on the Angular side:

```bash
# Terminal 1: Start the API
mvn spring-boot:run -pl todo-api

# Terminal 2: Start Angular dev server with proxy
cd todo-ui
ng serve --proxy-config proxy.conf.json
# Angular dev server on http://localhost:4200, proxies /api/* to http://localhost:8080
```

### Proxy config for Angular dev server (todo-ui/proxy.conf.json)

```json
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## Common Pitfalls

- **Angular output path mismatch**: Angular 17+ outputs to `dist/<project>/browser/`. Verify after first build and update `maven-resources-plugin` `<directory>` accordingly
- **Node version mismatch**: `frontend-maven-plugin` downloads its own Node. The version in `<nodeVersion>` must match the Angular CLI's requirements
- **CHROME_BIN not set**: headless Chrome tests may fail in CI. Set `CHROME_BIN=/usr/bin/chromium-browser` or install `puppeteer` as a dev dependency
- **Stale static files**: run `mvn clean` before `verify` to ensure fresh Angular build output is copied
- **Parent POM packaging**: must be `<packaging>pom</packaging>`. If it is `jar` (the default), child module resolution breaks
