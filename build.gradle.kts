plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
    id("org.jetbrains.kotlin.plugin.serialization") version "2.1.0";
}

group = "com.foodjournal"
version = "0.0.1"

application {
    mainClass.set("io.ktor.server.netty.EngineMain")

    val isDevelopment: Boolean = project.ext.has("development")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
}

repositories {
    mavenCentral()
}
/*
tasks.test {
    testLogging {
        showStandardStreams = true
    }
}
*/
sourceSets {
    test {
        resources {
            srcDirs("src/test/resources")
        }
    }
}
tasks {
    withType<Copy> {
        duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    }
}
tasks.withType<JavaCompile> {
    sourceCompatibility = "23"
    targetCompatibility = "23"
}
val ktor_version = "3.1.2"
dependencies {
    testImplementation(kotlin("test"))
    implementation("org.mindrot:jbcrypt:0.4")
    implementation("io.ktor:ktor-server-resources:<ktor_version>")
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation(libs.h2)
    implementation(libs.ktor.server.thymeleaf)
    implementation(libs.ktor.serialization.gson)
    implementation(libs.ktor.server.metrics)
    implementation(libs.ktor.server.cors)
    implementation(libs.ktor.server.resources)
    implementation(libs.ktor.server.host.common)
    implementation(libs.ktor.server.status.pages)
    implementation(libs.ktor.server.csrf)
    implementation(libs.ktor.server.auth)
    implementation(libs.ktor.server.netty)
    implementation(libs.logback.classic)
    implementation(libs.ktor.server.config.yaml)
    implementation("com.mysql:mysql-connector-j:9.1.0")
    implementation(libs.ktor.server.test.host)
    implementation(libs.kotlin.test.junit)
    testImplementation(libs.ktor.server.test.host)
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation(libs.kotlin.test.junit)
    implementation("org.jetbrains.kotlin", "kotlin-test-junit", "1.9.10")
    implementation("io.ktor", "ktor-server-tests", "2.3.11")
    testImplementation("io.ktor", "ktor-server-tests", "2.3.11")
    testImplementation("org.jetbrains.kotlin", "kotlin-test-junit", "1.9.10")
    implementation(kotlin("test"))
    implementation("io.ktor", "ktor-server-core", "2.3.11")
    implementation("io.ktor", "ktor-server-netty", "2.3.11")
    implementation("io.ktor", "ktor-serialization-jackson", "2.3.11")
    implementation("io.ktor:ktor-server-core:2.x.x")
    implementation("io.ktor:ktor-server-netty:2.x.x")
    testImplementation("org.junit.jupiter:junit-jupiter:5.x.x")
    implementation("io.ktor:ktor-server-tests:2.x.x")
    implementation("org.jetbrains.kotlin:kotlin-test:1.x.x")
    implementation("io.ktor:ktor-client-content-negotiation:3.0.2")
    implementation("io.ktor:ktor-server-auth:$ktor_version")
    implementation("io.ktor:ktor-server-auth-jwt:$ktor_version")
    implementation("io.ktor:ktor-server-core:$ktor_version")
    implementation("io.insert-koin:koin-ktor:3.5.0")
    implementation("io.insert-koin:koin-logger-slf4j:3.5.0")
    implementation("org.litote.kmongo:kmongo-coroutine:5.2.1")
    implementation("io.ktor:ktor-server-core:$ktor_version")
}
