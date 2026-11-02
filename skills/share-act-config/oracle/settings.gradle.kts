pluginManagement {
    val kotlinVersion: String by settings
    repositories { gradlePluginPortal(); mavenCentral() }
    plugins {
        id("org.jetbrains.kotlin.jvm") version kotlinVersion
        id("org.jetbrains.kotlin.plugin.serialization") version kotlinVersion
    }
}
dependencyResolutionManagement { repositories { mavenCentral() } }
rootProject.name = "share-act-configuration-oracle"
