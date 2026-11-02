plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    application
}
kotlin { jvmToolchain(17) }
val androidSource = providers.gradleProperty("androidSource").get()
kotlin.sourceSets.main {
    kotlin.srcDirs("$androidSource/core/src/main/kotlin", "$androidSource/app/src/main/java", "src/main/kotlin")
    kotlin.exclude("shareact/core/configuration/ConfigurationPrompt.kt")
    kotlin.include("shareact/core/**", "shareact/android/ui/rules/RuleWizardEnvelope.kt", "shareact/android/ui/rules/RuleConfigurationDiagnostics.kt", "shareact/android/rules/BotActionPolicy.kt", "shareact/android/ui/rules/RuleWizardTestFileCatalog.kt", "shareact/skill/**")
}
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:${providers.gradleProperty("serializationVersion").get()}")
    implementation("org.jsoup:jsoup:${providers.gradleProperty("jsoupVersion").get()}")
    implementation("com.ibm.icu:icu4j:${providers.gradleProperty("icuVersion").get()}")
}
application { mainClass.set("shareact.skill.MainKt") }
tasks.jar {
    archiveFileName.set("validator.jar")
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    manifest { attributes["Main-Class"] = "shareact.skill.MainKt" }
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
    exclude("META-INF/*.SF", "META-INF/*.RSA", "META-INF/*.DSA")
}
