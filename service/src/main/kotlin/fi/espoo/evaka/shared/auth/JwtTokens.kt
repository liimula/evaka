// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTCreator
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import java.time.Clock
import java.time.Duration
import java.time.ZonedDateTime
import java.util.Date
import java.util.UUID

private const val tokenIssuer = "evaka-service"
private val tokenExpiration = Duration.ofHours(1)

fun DecodedJWT.toAuthenticatedUser(): AuthenticatedUser? = this.subject?.let { subject ->
    val id = UUID.fromString(subject)
    val roles = (this.claims["scope"]?.asString() ?: "")
        .let {
            if (it.isNullOrEmpty()) emptyList()
            else it.split(' ')
        }
    return AuthenticatedUser(id, roles.map { UserRole.parse(it) }.toSet())
}

fun AuthenticatedUser.applyToJwt(jwt: JWTCreator.Builder): JWTCreator.Builder = jwt
    .withSubject(id.toString())
    .withClaim("scope", roles.joinToString(" "))

fun encodeSignedJwtToken(
    algorithm: Algorithm,
    user: AuthenticatedUser,
    clock: Clock = Clock.systemDefaultZone()
): String {
    val issuedAt = ZonedDateTime.now(clock)
    val expiresAt = issuedAt.plus(tokenExpiration)

    val jwt = JWT.create()
        .withIssuer(tokenIssuer)
        .withIssuedAt(Date.from(issuedAt.toInstant()))
        .withExpiresAt(Date.from(expiresAt.toInstant()))
    user.applyToJwt(jwt)
    return jwt.sign(algorithm)
}
