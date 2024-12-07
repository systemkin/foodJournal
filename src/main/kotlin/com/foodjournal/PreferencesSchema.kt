package com.foodjournal

import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction


@Serializable
data class ExposedPreference(val login: String, val json: String)

class PreferencesService(database: Database) {
    object Preferences : Table() {
        val login = varchar("login", length = 128).references(UserService.Users.login)
        val json = text("json")

        override val primaryKey = PrimaryKey(login)
    }

    init {
        transaction(database) {
            SchemaUtils.create(Preferences)
        }
    }

    suspend fun create(preference: ExposedPreference): String = dbQuery {
        Preferences.insert {
            it[login] = preference.login
            it[json] = preference.json
        }[Preferences.login]
    }

    suspend fun read(login: String): ExposedPreference? {
        return dbQuery {
            Preferences.selectAll()
                .where { Preferences.login eq login }
                .map { ExposedPreference(it[Preferences.login], it[Preferences.json]) }
                .singleOrNull()
        }
    }

    suspend fun update(login: String, preference: ExposedPreference) {
        dbQuery {
            Preferences.update({ Preferences.login eq login }) {
                it[json] = preference.json
            }
        }
    }

    suspend fun delete(login: String) {
        dbQuery {
            Preferences.deleteWhere { Preferences.login eq login }
        }
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
