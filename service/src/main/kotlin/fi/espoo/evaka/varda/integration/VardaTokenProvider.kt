// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.varda.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.Fuel
import com.github.kittinunf.fuel.core.Headers
import fi.espoo.evaka.shared.utils.responseStringWithRetries
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.temporal.ChronoUnit

interface VardaTokenProvider {
    /**
     * Wrapper that provides a valid Varda API token and a method for refreshing it in case the current one
     * gets invalidated.
     */
    fun <T> withToken(action: (token: String, refresh: () -> String) -> T): T
}

/**
 * Provide a temporary token fetched with basic authentication credentials from the Varda API.
 *
 * The API only has a single active token per user at a time, making it shared mutable (and remote) state
 * which needs to be locked to prevent invalidating a token about to be used. This is handled automatically
 * and internally in this provider with a mutex.
 */
@Service
class VardaTempTokenProvider(
    env: Environment,
    private val objectMapper: ObjectMapper,
    baseUrl: String = env.getRequiredProperty("fi.espoo.integration.varda.url")
) : VardaTokenProvider {
    private val basicAuth = "Basic ${env.getProperty("fi.espoo.integration.varda.basic_auth")}"
    private val apiTokenUrl = "$baseUrl/user/apikey/"

    // TODO: How to actually enforce that token is mutable only within a single shared mutex?
    private val tokenMutex = Mutex()
    private var token: VardaApiToken? = null

    // TODO: Could we provide an algebraic effect like method for catching token errors and continuing after a refresh?
    // TODO: Drop runBlocking if ever called from a context using coroutines
    override fun <T> withToken(action: (token: String, refreshToken: () -> String) -> T): T = runBlocking {
        tokenMutex.withLock { action(getValidToken().token) { getValidToken(forceNew = true).token } }
    }

    private fun getValidToken(forceNew: Boolean = false): VardaApiToken =
        when (!forceNew && VardaApiToken.isValid(token)) {
            true -> token!!
            false -> {
                token = fetchToken()
                token!!
            }
        }

    private fun fetchToken(): VardaApiToken = Fuel.get(apiTokenUrl)
        .header(Headers.AUTHORIZATION, basicAuth)
        .header(Headers.ACCEPT, "application/json")
        .header(Headers.CONTENT_TYPE, "application/json")
        .responseStringWithRetries(3)
        .third
        .fold(
            { d -> VardaApiToken.from(objectMapper.readTree(d).get("token").asText()) },
            { err -> throw IllegalStateException("Requesting Varda API token failed: ${String(err.errorData)}. Aborting update") }
        )
}

private data class VardaApiToken(
    val token: String,
    val createdAt: Instant
) {
    companion object {
        fun from(token: String) = VardaApiToken(token, Instant.now())

        // NOTE: This is just our perception of a token's validity. Varda API can invalidate a token at any point.
        fun isValid(token: VardaApiToken?): Boolean =
            token?.createdAt?.isAfter(Instant.now().minus(12, ChronoUnit.HOURS)) ?: false
    }
}