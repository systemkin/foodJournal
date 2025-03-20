package com.foodjournal.serving

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.client.engine.cio.*
import io.ktor.http.*
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class Message(val role: String, val content: String)

@Serializable
data class RequestBody(
    val model: String,
    val messages: List<Message>,
    val documents: List<String> = emptyList(),
    val tools: List<String> = emptyList(),
    val n: Int = 1,
    val max_tokens: Int = 2048,
    val temperature: Double = 0.4,
    val top_p: Double = 1.0,
    val stop: List<String> = emptyList(),
    val response_format: Map<String, String> = mapOf("type" to "text")
)

suspend fun generateResponse(): String {
    val client = HttpClient(CIO)

    return try {
        // Create the request body
        val requestBody = RequestBody(
            model = "jamba-1.5-large",
            messages = listOf(
                Message(
                    role = "user",
                    content = "Make a short (20-25 words) encouragement message about keeping the food plan and after that remind about recount macronutrient goals after weight change"
                )
            )
        )

        // Make the POST request
        val response: HttpResponse = client.post("https://api.ai21.com/studio/v1/chat/completions") {
            headers {
                append(HttpHeaders.Authorization, "Bearer Hzcd0ZnTn7QvMBGaxw0v8wLQ7nb1nICF")
                append(HttpHeaders.ContentType, ContentType.Application.Json.toString())
            }
            setBody(Json.encodeToString(requestBody))

        }

        // Read and return the response as a string
        response.bodyAsText()
    } catch (e: Exception) {
        println("Error: ${e.message}")
        "Error: ${e.message}" // Return error message as a string
    } finally {
        client.close()
    }
}

fun main() = runBlocking {
    val responseString = generateResponse()
    println("Response: $responseString")
}
