package shareact.skill

import com.ibm.icu.lang.UCharacter
import kotlinx.serialization.json.*
import shareact.android.ui.rules.*
import shareact.core.model.*
import shareact.core.rules.RuleEngine
import shareact.core.template.TemplateRenderer
import shareact.core.request.RequestBuilder
import java.time.Instant

private val json = Json { encodeDefaults = true; explicitNulls = true }

private fun validate(request: JsonObject): JsonObject {
    var codecAccepted = false
    var matched = false
    var rendered = false
    var requestValid = false
    var normalized: JsonElement? = null
    var error: String? = null
    val context = request.getValue("context").jsonObject
    val text = request.getValue("raw").jsonPrimitive.content
    try {
        val id = context.getValue("bot_id").jsonPrimitive.content
        val language = context.getValue("language").jsonPrimitive.content
        // No real endpoint, secret value or network access is required by the offline codec.
        val bot = if (context["connection"] != null) json.decodeFromJsonElement<ConnectionConfig>(context.getValue("connection"))
            else ConnectionConfig(id, 1, "Selected Bot (offline metadata fixture)", Adapter.GROK, "https://example.com/grok-hook", headers = mapOf("Authorization" to HeaderValue.SecretRef("offline-reference")))
        require(bot.id == id) { "context_bot_id_mismatch" }
        val draft = RuleWizardEnvelopeCodec.decode(text, bot, language)
        codecAccepted = true
        normalized = json.encodeToJsonElement(RuleWizardEnvelope.serializer(), RuleWizardEnvelope(1, draft.rule, draft.template, draft.testInput))
        val input = draft.testInput.toNormalizedInput(Instant.EPOCH)
        val fold = object : TextCaseFolder { override fun fold(text: String) = UCharacter.foldCase(text, UCharacter.FOLD_CASE_DEFAULT) }
        matched = RuleEngine(fold).match(input, listOf(draft.rule)).matches.any { it.id == draft.rule.id }
        val result = TemplateRenderer().render(draft.template, input, "00000000-0000-0000-0000-000000000001")
        rendered = result is RenderResult.Ready
        val snapshot = TaskSnapshot("00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002", TaskOrigin.SHARED_INPUT, input, draft.rule, draft.template, null, bot.version, Instant.EPOCH, Instant.EPOCH.plusSeconds(Limits.DELIVERY_WINDOW_SECONDS), connectionId = bot.id)
        val built = RequestBuilder().build(snapshot, bot)
        requestValid = built is RequestBuildResult.Ready
        error = when {
            !matched -> "sample_does_not_match_rule"
            result is RenderResult.Invalid -> result.issues.joinToString(",") { it.code }
            built is RequestBuildResult.Invalid -> built.issues.joinToString(",") { it.code }
            else -> null
        }
    } catch (e: Exception) {
        error = e.message?.takeIf { it.matches(Regex("[a-zA-Z0-9_,.: -]{1,200}")) } ?: "invalid_configuration"
    }
    return buildJsonObject {
        put("codec_accepted", codecAccepted)
        put("sample_matches", matched)
        put("template_renders", rendered)
        put("request_builds", requestValid)
        put("dry_run_passed", codecAccepted && matched && rendered && requestValid)
        put("error", error?.let(::JsonPrimitive) ?: JsonNull)
        if (normalized != null) put("normalized", normalized!!)
        put("connection_context", if (context["connection"] == null) "synthetic_metadata_only" else "supplied_metadata_only")
        put("live_service_readiness_checked", false)
    }
}

fun main() {
    generateSequence(::readLine).forEach { line ->
        try {
            val request = json.parseToJsonElement(line).jsonObject
            if (request["describe"]?.jsonPrimitive?.booleanOrNull == true) {
                println(buildJsonObject {
                    put("sample_files", buildJsonArray { RuleWizardSamples.files(true).forEach { sample -> add(buildJsonObject { put("file_name", sample.input.fileName); put("mime_type", sample.input.mimeType) }) } })
                    put("template_bytes", Limits.TEMPLATE_BYTES)
                    put("import_bytes", Limits.IMPORT_BYTES)
                    put("request_bytes", Limits.REQUEST_BYTES)
                })
            } else println(validate(request))
        }
        catch (_: Exception) { println("{\"codec_accepted\":false,\"dry_run_passed\":false,\"error\":\"invalid_oracle_request\"}") }
    }
}
