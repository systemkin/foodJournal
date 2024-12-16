package com.foodjournal

import com.codahale.metrics.*
import io.ktor.http.*
import io.ktor.resources.*
import io.ktor.serialization.gson.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.http.content.*
import io.ktor.server.metrics.dropwizard.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.csrf.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.resources.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import io.ktor.server.thymeleaf.Thymeleaf
import io.ktor.server.thymeleaf.ThymeleafContent
import java.util.concurrent.TimeUnit
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver

@Serializable
data class MyPassword(val pass: String)
@Serializable
data class MyJson(val json: String)
@Serializable
data class MyDateSpan(val dateStart: String, val dateEnd: String)

fun Application.configureDatabases() {
    val database = Database.connect(
        url = "jdbc:mysql://localhost:3306/auth",
        user = "root",
        driver = "com.mysql.cj.jdbc.Driver",
        password = "mysql",
    )
    /*User management
        /accounts                           <--- PUT/POST/DELETE ||| Change Password / Create Account / Delete Account
     */
    val userService = UserService(database)
    routing {
        //Create account
        post("/accounts") {
            val user = call.receive<ExposedUser>()
            try {
                userService.create(user);
            } catch (e: org.jetbrains.exposed.exceptions.ExposedSQLException) {
                call.respondText("User already exists", status = HttpStatusCode.Conflict)
            }
                call.respondText("User created", status = HttpStatusCode.OK)
        }


        authenticate("auth-session") {
                //Change password
                put("/accounts") {
                    val pass = call.receive<MyPassword>().pass
                    val session = call.sessions.get<UserSession>()
                    if (session == null) {
                        call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                    } else {
                        val login = session.login

                        val user = ExposedUser(login, pass);
                        userService.update(user);
                    }

                }

                //Delete account
                delete("/accounts") {
                    val session = call.sessions.get<UserSession>()
                    if (session == null) {
                        call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                    } else {
                        val login = session.login
                        userService.delete(login);
                    }

                }

            }
        }

    /*
        /incomes						    <--- GET/PUT/POST/DELETE
        /preferences						<--- GET/PUT/POST/DELETE
     */
    val incomesService = IncomesService(database)
    routing {
        authenticate("auth-session") {

            get("/incomes") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    call.respond(incomesService.read(login))
                }
            }
            get("/incomes/{page}") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val page = call.parameters["page"]?.toInt() ?: throw IllegalArgumentException("Invalid Page")
                    val login = session.login
                    call.respond(incomesService.readPaged(login, page, 1000))
                }
            }
            delete("/incomes/{id}") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
                    incomesService.delete(id, login)
                    call.respondText("Deleted successfully", status = HttpStatusCode.OK)
                }
            }
            put("/incomes") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val income = call.receive<ExposedIncome>()
                    incomesService.update(ExposedIncome(income.id, login, income.json))
                    call.respondText("Updated successfully", status = HttpStatusCode.OK)
                }
            }
            post("/incomes") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val json = call.receive<MyJson>().json
                    val income  = InsertIncome(session.login, json)
                    val id = incomesService.create(income)
                    call.respondText(id.toString(), status = HttpStatusCode.OK)
                }
            }

        }
    }


    val preferencesService = PreferencesService(database)
    routing {
        authenticate("auth-session") {

            get("/preferences") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    call.respond(preferencesService.read(login))
                }
            }
            delete("/preferences/{id}") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
                    preferencesService.delete(id, login)

                    call.respondText("Deleted successfully", status = HttpStatusCode.OK)
                }
            }
            put("/preferences") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val preference = call.receive<ExposedPreference>()
                    preferencesService.update(ExposedPreference(preference.id, login, preference.json))
                    call.respondText("Updated successfully", status = HttpStatusCode.OK)
                }
            }
            post("/preferences") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val json = call.receive<MyJson>().json
                    val preference = InsertPreference(session.login, json)
                    preferencesService.create(preference)
                    call.respondText("Created successfully", status = HttpStatusCode.OK)
                }
            }

        }
    }


    val goalsService = GoalsService(database)
    routing {
        authenticate("auth-session") {
            get("/goals") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    val goal = goalsService.read(login)
                    if (goal == null) {
                        call.respondText("No current goal", status = HttpStatusCode.NoContent)
                    }else {
                        call.respond(goal)
                    }
                }
            }

            post("/goals") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val json = call.receive<MyJson>().json
                    val goal = InsertGoal(session.login, json)
                    goalsService.delete(session.login)
                    goalsService.create(goal)
                    call.respondText("Created successfully", status = HttpStatusCode.OK)
                }
            }

            delete("/goals") {
                val session = call.sessions.get<UserSession>()
                if (session == null) {
                    call.respondText("No active session", status = HttpStatusCode.Unauthorized)
                } else {
                    val login = session.login
                    goalsService.delete(login)
                    call.respondText("Deleted successfully", status = HttpStatusCode.OK)
                }
            }
            get("/database") {
                call.respondText("[{\"title\":\"Hummus, commercial\",\"protein\":7.35,\"fat\":16.1,\"carbs\":14.9},{\"title\":\"Tomatoes, grape, raw\",\"fat\":0.63,\"protein\":0.83,\"carbs\":5.51},{\"title\":\"Beans, snap, green, canned, regular pack, drained solids\",\"fat\":0.39,\"carbs\":4.11,\"protein\":1.04},{\"title\":\"Frankfurter, beef, unheated\",\"fat\":26,\"carbs\":2.89,\"protein\":11.7},{\"title\":\"Nuts, almonds, dry roasted, with salt added\",\"fat\":53.4,\"carbs\":16.2,\"protein\":20.4},{\"title\":\"Kale, raw\",\"protein\":2.92,\"fat\":1.49,\"carbs\":4.42},{\"title\":\"Egg, whole, raw, frozen, pasteurized\",\"protein\":12.3,\"fat\":10.3,\"carbs\":0.91},{\"title\":\"Egg, white, raw, frozen, pasteurized\",\"fat\":0.16,\"carbs\":0.74,\"protein\":10.1},{\"title\":\"Egg, white, dried\",\"protein\":79.9,\"fat\":0.65,\"carbs\":6.02},{\"title\":\"Onion rings, breaded, par fried, frozen, prepared, heated in oven\",\"fat\":12.6,\"carbs\":36.3,\"protein\":4.52},{\"title\":\"Pickles, cucumber, dill or kosher dill\",\"fat\":0.43,\"carbs\":1.99,\"protein\":0.48},{\"title\":\"Cheese, parmesan, grated\",\"fat\":24,\"carbs\":12.4,\"protein\":29.6},{\"title\":\"Cheese, pasteurized process, American, vitamin D fortified\",\"protein\":18,\"fat\":27.6,\"carbs\":5.27},{\"title\":\"Grapefruit juice, white, canned or bottled, unsweetened\",\"protein\":0.55,\"fat\":0.7,\"carbs\":7.59},{\"title\":\"Peaches, yellow, raw\",\"carbs\":10.1,\"protein\":0.91,\"fat\":0.27},{\"title\":\"Seeds, sunflower seed kernels, dry roasted, with salt added\",\"fat\":52.1,\"carbs\":17.1,\"protein\":21},{\"title\":\"Bread, white, commercially prepared\",\"fat\":3.45,\"carbs\":49.2,\"protein\":9.43},{\"title\":\"Kale, frozen, cooked, boiled, drained, without salt\",\"fat\":1.21,\"carbs\":5.3,\"protein\":2.94},{\"title\":\"Mustard, prepared, yellow\",\"protein\":4.25,\"fat\":3.76,\"carbs\":5.3},{\"title\":\"Kiwifruit, green, raw\",\"fat\":0.44,\"protein\":1.06,\"carbs\":14},{\"title\":\"Nectarines, raw\",\"carbs\":9.18,\"fat\":0.13,\"protein\":1.06},{\"title\":\"Cheese, cheddar\",\"carbs\":2.44,\"protein\":23.3,\"fat\":29},{\"title\":\"Cheese, cottage, lowfat, 2% milkfat\",\"fat\":1.87,\"carbs\":4.31,\"protein\":11},{\"title\":\"Cheese, mozzarella, low moisture, part-skim\",\"protein\":23.7,\"fat\":17.8,\"carbs\":4.44},{\"title\":\"Egg, whole, dried\",\"protein\":48.1,\"fat\":39.8,\"carbs\":1.87},{\"title\":\"Egg, yolk, raw, frozen, pasteurized\",\"fat\":25.1,\"carbs\":0.59,\"protein\":15.6},{\"title\":\"Egg, yolk, dried\",\"fat\":55.5,\"carbs\":1.07,\"protein\":34.2},{\"title\":\"Yogurt, Greek, plain, nonfat\",\"protein\":10.3,\"fat\":0.17,\"carbs\":3.64},{\"title\":\"Yogurt, Greek, strawberry, nonfat\",\"fat\":0.15,\"carbs\":12.2,\"protein\":8.06},{\"title\":\"Oil, coconut\",\"protein\":0,\"fat\":90.5,\"carbs\":0.84},{\"title\":\"Chicken, broilers or fryers, drumstick, meat only, cooked, braised\",\"protein\":23.9,\"fat\":5.23,\"carbs\":0},{\"title\":\"Chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised\",\"fat\":3.05,\"carbs\":0,\"protein\":32.1},{\"title\":\"Sauce, pasta, spaghetti/marinara, ready-to-serve\",\"fat\":1.05,\"carbs\":8.05,\"protein\":1.41},{\"title\":\"Ham, sliced, pre-packaged, deli meat (96%fat free, water added)\",\"protein\":16.7,\"fat\":3.15,\"carbs\":0.27},{\"title\":\"Olives, green, Manzanilla, stuffed with pimiento\",\"fat\":11.8,\"protein\":1.15,\"carbs\":4.96},{\"title\":\"Cookies, oatmeal, soft, with raisins\",\"fat\":13.7,\"protein\":5.79,\"carbs\":69.6},{\"title\":\"Tomatoes, canned, red, ripe, diced\",\"fat\":0.5,\"protein\":0.84,\"carbs\":3.32},{\"title\":\"Fish, haddock, raw\",\"fat\":0.32,\"protein\":16.3,\"carbs\":0},{\"title\":\"Fish, pollock, raw\",\"fat\":0.4,\"protein\":12.3,\"carbs\":0},{\"title\":\"Fish, tuna, light, canned in water, drained solids\",\"fat\":0.6,\"protein\":19,\"carbs\":0.08},{\"title\":\"Restaurant, Chinese, fried rice, without meat\",\"fat\":2.22,\"carbs\":32.5,\"protein\":3.84},{\"title\":\"Restaurant, Latino, tamale, pork\",\"protein\":7.38,\"fat\":7.98,\"carbs\":15.8},{\"title\":\"Restaurant, Latino, pupusas con frijoles (pupusas, bean)\",\"protein\":5.59,\"fat\":8.08,\"carbs\":31.5},{\"title\":\"Bread, whole-wheat, commercially prepared\",\"fat\":2.98,\"carbs\":43.1,\"protein\":12.3},{\"title\":\"Beef, loin, tenderloin roast, separable lean only, boneless, trimmed to 0 fat, select, cooked, roasted\",\"fat\":5.56,\"carbs\":0,\"protein\":27.7},{\"title\":\"Beef, loin, top loin steak, boneless, lip-on, separable lean only, trimmed to 1/8 fat, choice, raw\",\"fat\":5.93,\"carbs\":0,\"protein\":22.8},{\"title\":\"Beef, round, eye of round roast, boneless, separable lean only, trimmed to 0 fat, select, raw\",\"protein\":23.4,\"fat\":2.23,\"carbs\":0},{\"title\":\"Beef, round, top round roast, boneless, separable lean only, trimmed to 0 fat, select, raw\",\"fat\":2.14,\"carbs\":0,\"protein\":23.7},{\"title\":\"Beef, short loin, porterhouse steak, separable lean only, trimmed to 1/8 fat, select, raw\",\"fat\":4.5,\"protein\":22.7,\"carbs\":0},{\"title\":\"Beef, short loin, t-bone steak, bone-in, separable lean only, trimmed to 1/8 fat, choice, cooked, grilled\",\"protein\":27.3,\"fat\":10.5,\"carbs\":0},{\"title\":\"Carrots, frozen, unprepared\",\"fat\":0.33,\"protein\":0.81,\"carbs\":7.92},{\"title\":\"Cheese, dry white, queso seco\",\"protein\":24.5,\"fat\":21.4,\"carbs\":2.07},{\"title\":\"Cheese, ricotta, whole milk\",\"protein\":7.81,\"fat\":10.3,\"carbs\":6.86},{\"title\":\"Cheese, swiss\",\"fat\":27.6,\"carbs\":1.44,\"protein\":27},{\"title\":\"Figs, dried, uncooked\",\"carbs\":63.9,\"protein\":3.3,\"fat\":0.92},{\"title\":\"Lettuce, cos or romaine, raw\",\"carbs\":3.24,\"fat\":0.26,\"protein\":1.24},{\"title\":\"Melons, cantaloupe, raw\",\"carbs\":8.16,\"protein\":0.82,\"fat\":0.18},{\"title\":\"Oranges, raw, navels\",\"protein\":0.91,\"fat\":0.15,\"carbs\":11.8},{\"title\":\"Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D\",\"protein\":3.38,\"fat\":0.85,\"carbs\":5.18},{\"title\":\"Pears, raw, bartlett\",\"protein\":0.38,\"fat\":0.16,\"carbs\":15.1},{\"title\":\"Restaurant, Chinese, sweet and sour pork\",\"protein\":8.88,\"fat\":13.3,\"carbs\":25.5},{\"title\":\"Salt, table, iodized\"},{\"title\":\"Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)\",\"fat\":0.07,\"protein\":3.43,\"carbs\":4.92},{\"title\":\"Sauce, salsa, ready-to-serve\",\"protein\":1.44,\"carbs\":6.74,\"fat\":0.19},{\"title\":\"Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D\",\"protein\":3.36,\"carbs\":4.9,\"fat\":1.64},{\"title\":\"Sausage, breakfast sausage, beef, pre-cooked, unprepared\",\"fat\":27.1,\"carbs\":3.37,\"protein\":13.3},{\"title\":\"Sausage, Italian, pork, mild, cooked, pan-fried\",\"fat\":25.8,\"carbs\":2.15,\"protein\":18.2},{\"title\":\"Sausage, pork, chorizo, link or ground, cooked, pan-fried\",\"fat\":26,\"protein\":19.3,\"carbs\":2.63},{\"title\":\"Milk, whole, 3.25% milkfat, with added vitamin D\",\"fat\":2.77,\"carbs\":4.63,\"protein\":3.27},{\"title\":\"Sausage, turkey, breakfast links, mild, raw\",\"protein\":16.7,\"fat\":8.86,\"carbs\":0.93},{\"title\":\"Sugars, granulated\",\"protein\":0,\"fat\":0.32,\"carbs\":99.6},{\"title\":\"Turkey, ground, 93% lean, 7% fat, pan-broiled crumbles\",\"fat\":10.4,\"protein\":27.1,\"carbs\":0},{\"title\":\"Ham, sliced, restaurant\",\"fat\":3.54,\"protein\":19.6,\"carbs\":2.36},{\"title\":\"Cheese, American, restaurant\",\"fat\":26.6,\"protein\":17.5,\"carbs\":6.35},{\"title\":\"Beans, Dry, Medium Red (0% moisture)\",\"protein\":25.5,\"fat\":1.04},{\"title\":\"Beans, Dry, Red (0% moisture)\",\"protein\":21.3,\"fat\":1.16},{\"title\":\"Beans, Dry, Flor de Mayo (0% moisture)\",\"protein\":23.3,\"fat\":0.86},{\"title\":\"Beans, Dry, Brown (0% moisture)\",\"protein\":25.6,\"fat\":1.12},{\"title\":\"Beans, Dry, Tan (0% moisture)\",\"protein\":26.8,\"fat\":1.14},{\"title\":\"Beans, Dry, Light Tan (0% moisture)\",\"protein\":24.6,\"fat\":1.28},{\"title\":\"Beans, Dry, Carioca (0% moisture)\",\"protein\":25.2,\"fat\":1.44},{\"title\":\"Beans, Dry, Cranberry (0% moisture)\",\"protein\":24.4,\"fat\":1.23},{\"title\":\"Beans, Dry, Light Red Kidney (0% moisture)\",\"protein\":25,\"fat\":1.03},{\"title\":\"Beans, Dry, Pink (0% moisture)\",\"protein\":23.4,\"fat\":1.2},{\"title\":\"Beans, Dry, Dark Red Kidney (0% moisture)\",\"protein\":25.9,\"fat\":1.31},{\"title\":\"Beans, Dry, Navy (0% moisture)\",\"protein\":24.1,\"fat\":1.51},{\"title\":\"Beans, Dry, Small White (0% moisture)\",\"protein\":24.5,\"fat\":1.32},{\"title\":\"Beans, Dry, Small Red (0% moisture)\",\"protein\":23.5,\"fat\":1.28},{\"title\":\"Beans, Dry, Black (0% moisture)\",\"protein\":24.4,\"fat\":1.45},{\"title\":\"Beans, Dry, Pinto (0% moisture)\",\"protein\":23.7,\"fat\":1.24},{\"title\":\"Beans, Dry, Great Northern (0% moisture)\",\"protein\":24.7,\"fat\":1.24},{\"title\":\"Broccoli, raw\",\"carbs\":6.27,\"fat\":0.07,\"protein\":2.57},{\"title\":\"Ketchup, restaurant\",\"fat\":0.55,\"protein\":1.11,\"carbs\":26.8},{\"title\":\"Eggs, Grade A, Large, egg white\",\"protein\":10.7,\"fat\":0,\"carbs\":2.36},{\"title\":\"Eggs, Grade A, Large, egg yolk\",\"fat\":28.8,\"protein\":16.2,\"carbs\":1.02},{\"title\":\"Oil, canola\",\"fat\":94.5},{\"title\":\"Oil, corn\",\"fat\":94},{\"title\":\"Oil, soybean\",\"fat\":94.6},{\"title\":\"Oil, olive, extra virgin\",\"fat\":93.7},{\"title\":\"Eggs, Grade A, Large, egg whole\",\"protein\":12.4,\"fat\":8.65,\"carbs\":0.96},{\"title\":\"Pork, cured, bacon, cooked, restaurant\",\"fat\":34.6,\"protein\":40.9,\"carbs\":2.1},{\"title\":\"Butter, stick, unsalted\",\"fat\":81.5},{\"title\":\"Flour, wheat, all-purpose, enriched, bleached\",\"protein\":10.9,\"fat\":1.48,\"carbs\":77.3},{\"title\":\"Flour, wheat, all-purpose, enriched, unbleached\",\"fat\":1.48,\"carbs\":73.2,\"protein\":13.1},{\"title\":\"Flour, wheat, all-purpose, unenriched, unbleached\",\"fat\":1.7,\"carbs\":74.6,\"protein\":12},{\"title\":\"Flour, whole wheat, unenriched\",\"fat\":2.73,\"carbs\":71.2,\"protein\":15.1},{\"title\":\"Flour, bread, white, enriched, unbleached\",\"protein\":14.3,\"fat\":1.65,\"carbs\":72.8},{\"title\":\"Flour, rice, white, unenriched\",\"fat\":1.3,\"carbs\":79.8,\"protein\":6.94},{\"title\":\"Flour, corn, yellow, fine meal, enriched\",\"fat\":1.74,\"protein\":6.2,\"carbs\":80.8},{\"title\":\"Butter, stick, salted\",\"fat\":65},{\"title\":\"Onions, red, raw\",\"protein\":0.94,\"fat\":0.1,\"carbs\":9.93},{\"title\":\"Onions, yellow, raw\",\"protein\":0.83,\"fat\":0.05,\"carbs\":8.61},{\"title\":\"Garlic, raw\",\"fat\":0.38,\"protein\":6.62,\"carbs\":28.2},{\"title\":\"Flour, soy, defatted\",\"fat\":3.33,\"carbs\":32.9,\"protein\":51.1},{\"title\":\"Flour, soy, full-fat\",\"carbs\":27.9,\"protein\":38.6,\"fat\":20.7},{\"title\":\"Flour, rice, brown\",\"protein\":7.19,\"fat\":3.85,\"carbs\":75.5},{\"title\":\"Flour, rice, glutinous\",\"fat\":1.16,\"protein\":6.69,\"carbs\":80.1},{\"title\":\"Flour, pastry, unenriched, unbleached\",\"fat\":1.64,\"protein\":8.75,\"carbs\":77.2},{\"title\":\"Onions, white, raw\",\"fat\":0.13,\"protein\":0.89,\"carbs\":7.68},{\"title\":\"Bananas, overripe, raw\",\"fat\":0.22,\"protein\":0.73,\"carbs\":20.1},{\"title\":\"Bananas, ripe and slightly ripe, raw\",\"carbs\":23,\"protein\":0.74,\"fat\":0.29},{\"title\":\"Apples, red delicious, with skin, raw\",\"fat\":0.212,\"protein\":0.188,\"carbs\":14.8},{\"title\":\"Apples, fuji, with skin, raw\",\"fat\":0.162,\"protein\":0.148,\"carbs\":15.7},{\"title\":\"Apples, gala, with skin, raw\",\"fat\":0.15,\"protein\":0.133,\"carbs\":14.8},{\"title\":\"Apples, granny smith, with skin, raw\",\"fat\":0.138,\"protein\":0.266,\"carbs\":14.1},{\"title\":\"Apples, honeycrisp, with skin, raw\",\"fat\":0.1,\"protein\":0.102,\"carbs\":14.7},{\"title\":\"Oil, peanut\",\"fat\":93.4},{\"title\":\"Oil, sunflower\",\"fat\":93.2},{\"title\":\"Oil, safflower\",\"fat\":93.2},{\"title\":\"Oil, olive, extra light\",\"fat\":92.9},{\"title\":\"Mushroom, lion's mane\",\"fat\":0.256,\"protein\":2.5,\"carbs\":7.59},{\"title\":\"Mushroom, oyster\",\"fat\":0.188,\"protein\":2.9,\"carbs\":6.94},{\"title\":\"Mushrooms, shiitake\",\"fat\":0.195,\"protein\":2.41,\"carbs\":8.17},{\"title\":\"Mushrooms, white button\",\"fat\":0.371,\"protein\":2.89,\"carbs\":4.08},{\"title\":\"Soy milk, unsweetened, plain, shelf stable\",\"fat\":1.88,\"protein\":3.55,\"carbs\":1.29},{\"title\":\"Almond milk, unsweetened, plain, shelf stable\",\"fat\":1.11,\"protein\":0.555,\"carbs\":0.337},{\"title\":\"Spinach, baby\",\"fat\":0.619,\"protein\":2.85,\"carbs\":2.41},{\"title\":\"Spinach, mature\",\"fat\":0.604,\"protein\":2.91,\"carbs\":2.64},{\"title\":\"Tomato, roma\",\"fat\":0.425,\"protein\":0.696,\"carbs\":3.84},{\"title\":\"Flour, 00\",\"fat\":1.52,\"protein\":11.4,\"carbs\":74.4},{\"title\":\"Flour, spelt, whole grain\",\"fat\":2.54,\"protein\":14.5,\"carbs\":70.7},{\"title\":\"Flour, semolina, coarse and semi-coarse\",\"fat\":1.6,\"protein\":11.7,\"carbs\":73.8},{\"title\":\"Flour, semolina, fine\",\"fat\":1.84,\"protein\":13.3,\"carbs\":72},{\"title\":\"Apple juice, with added vitamin C, from concentrate, shelf stable\",\"fat\":0.286,\"protein\":0.086,\"carbs\":11.4},{\"title\":\"Orange juice, no pulp, not fortified, from concentrate, refrigerated\",\"fat\":0.325,\"protein\":0.734,\"carbs\":10.3},{\"title\":\"Grape juice, purple, with added vitamin C, from concentrate, shelf stable\",\"fat\":0.288,\"protein\":0.258,\"carbs\":15.6},{\"title\":\"Grape juice, white, with added vitamin C, from concentrate, shelf stable\",\"fat\":0.265,\"protein\":0.094,\"carbs\":15.8},{\"title\":\"Cranberry juice, not fortified, from concentrate, shelf stable\",\"fat\":0.338,\"protein\":0,\"carbs\":7.26},{\"title\":\"Grapefruit juice, red, not fortified, not from concentrate, refrigerated\",\"fat\":0.267,\"protein\":0.57,\"carbs\":9.1},{\"title\":\"Tomato juice, with added ingredients, from concentrate, shelf stable\",\"fat\":0.288,\"protein\":0.859,\"carbs\":4.32},{\"title\":\"Orange juice, no pulp, not fortified, not from concentrate, refrigerated\",\"fat\":0.356,\"protein\":0.812,\"carbs\":10},{\"title\":\"Mushroom, portabella\",\"fat\":0.312,\"protein\":2.75,\"carbs\":4.66},{\"title\":\"Mushroom, king oyster\",\"fat\":0.308,\"protein\":2.41,\"carbs\":8.5},{\"title\":\"Mushroom, enoki\",\"fat\":0.245,\"protein\":2.42,\"carbs\":8.14},{\"title\":\"Mushroom, crimini\",\"fat\":0.197,\"protein\":3.09,\"carbs\":4.01},{\"title\":\"Mushroom, maitake\",\"fat\":0.265,\"protein\":2.2,\"carbs\":6.6},{\"title\":\"Mushroom, beech\",\"fat\":0.449,\"protein\":2.18,\"carbs\":6.76},{\"title\":\"Mushroom, pioppini\",\"fat\":0.24,\"protein\":3.5,\"carbs\":5.76},{\"title\":\"Soy milk, sweetened, plain, refrigerated\",\"fat\":1.96,\"protein\":2.78,\"carbs\":3},{\"title\":\"Almond milk, unsweetened, plain, refrigerated\",\"fat\":1.56,\"protein\":0.656,\"carbs\":0.671},{\"title\":\"Oat milk, unsweetened, plain, refrigerated\",\"fat\":2.75,\"protein\":0.797,\"carbs\":5.1},{\"title\":\"Carrots, mature, raw\",\"fat\":0.351,\"protein\":0.941,\"carbs\":10.3},{\"title\":\"Carrots, baby, raw\",\"fat\":0.138,\"protein\":0.805,\"carbs\":9.08},{\"title\":\"Peppers, bell, green, raw\",\"fat\":0.106,\"protein\":0.715,\"carbs\":4.78},{\"title\":\"Peppers, bell, yellow, raw\",\"fat\":0.121,\"carbs\":6.6,\"protein\":0.819},{\"title\":\"Peppers, bell, red, raw\",\"fat\":0.126,\"carbs\":6.65,\"protein\":0.896},{\"title\":\"Peppers, bell, orange, raw\",\"fat\":0.156,\"protein\":0.882,\"carbs\":6.7},{\"title\":\"Buttermilk, low fat\",\"fat\":1.08,\"protein\":3.46,\"carbs\":4.81},{\"title\":\"Yogurt, plain, whole milk\",\"fat\":4.48,\"carbs\":5.57,\"protein\":3.82},{\"title\":\"Yogurt, Greek, plain, whole milk\",\"fat\":4.39,\"carbs\":4.75,\"protein\":8.78},{\"title\":\"Cheese, parmesan, grated, refrigerated\",\"fat\":29.5,\"carbs\":4.33,\"protein\":30.1},{\"title\":\"Cheese, feta, whole milk, crumbled\",\"fat\":19.1,\"carbs\":5.58,\"protein\":19.7},{\"title\":\"Flour, almond\",\"fat\":50.2,\"protein\":26.2,\"carbs\":16.2},{\"title\":\"Flour, oat, whole grain\",\"fat\":6.31,\"carbs\":69.9,\"protein\":13.2},{\"title\":\"Flour, potato\",\"fat\":0.951,\"carbs\":79.9,\"protein\":8.11},{\"title\":\"Peanut butter, creamy\",\"fat\":49.4,\"protein\":24,\"carbs\":22.7},{\"title\":\"Sesame butter, creamy\",\"fat\":62.4,\"carbs\":14.2,\"protein\":19.7},{\"title\":\"Almond butter, creamy\",\"fat\":53,\"carbs\":21.2,\"protein\":20.8},{\"title\":\"Flaxseed, ground\",\"fat\":37.3,\"carbs\":34.4,\"protein\":18},{\"title\":\"Cottage cheese, full fat, large or small curd\",\"fat\":4.22,\"protein\":11.6,\"carbs\":4.6},{\"title\":\"Cream cheese, full fat, block\",\"fat\":33.5,\"carbs\":4.56,\"protein\":5.79},{\"title\":\"Cream, heavy\",\"fat\":35.6,\"protein\":2.02,\"carbs\":3.8},{\"title\":\"Cream, sour, full fat\",\"fat\":18,\"protein\":3.07,\"carbs\":5.56},{\"title\":\"Lettuce, iceberg, raw\",\"fat\":0.074,\"protein\":0.742,\"carbs\":3.37},{\"title\":\"Lettuce, romaine, green, raw\",\"fat\":0.071,\"protein\":0.977,\"carbs\":4.06},{\"title\":\"Lettuce, leaf, red, raw\",\"fat\":0.106,\"protein\":0.883,\"carbs\":3.26},{\"title\":\"Lettuce, leaf, green, raw\",\"fat\":0.156,\"carbs\":4.07,\"protein\":1.09},{\"title\":\"Nuts, pine nuts, raw\",\"fat\":61.3,\"carbs\":18.6,\"protein\":15.7},{\"title\":\"Nuts, almonds, whole, raw\",\"fat\":51.1,\"carbs\":20,\"protein\":21.5},{\"title\":\"Nuts, walnuts, English, halves, raw\",\"fat\":69.7,\"carbs\":10.9,\"protein\":14.6},{\"title\":\"Nuts, pecans, halves, raw\",\"fat\":73.3,\"carbs\":12.7,\"protein\":9.96},{\"title\":\"Oats, whole grain, rolled, old fashioned\",\"fat\":5.89,\"carbs\":68.7,\"protein\":13.5},{\"title\":\"Oats, whole grain, steel cut\",\"fat\":5.8,\"carbs\":69.8,\"protein\":12.5},{\"title\":\"Pineapple, raw\",\"fat\":0.211,\"carbs\":14.1,\"protein\":0.461},{\"title\":\"Cherries, sweet, dark red, raw\",\"fat\":0.192,\"protein\":1.04,\"carbs\":16.2},{\"title\":\"Beans, snap, green, raw\",\"fat\":0.275,\"protein\":1.97,\"carbs\":7.41},{\"title\":\"Potatoes, russet, without skin, raw\",\"fat\":0.36,\"carbs\":17.8,\"protein\":2.27},{\"title\":\"Potatoes, red, without skin, raw\",\"fat\":0.248,\"protein\":2.06,\"carbs\":16.3},{\"title\":\"Potatoes, gold, without skin, raw\",\"fat\":0.264,\"protein\":1.81,\"carbs\":16},{\"title\":\"Sweet potatoes, orange flesh, without skin, raw\",\"fat\":0.375,\"carbs\":17.3,\"protein\":1.58},{\"title\":\"Celery, raw\",\"fat\":0.162,\"protein\":0.492,\"carbs\":3.32},{\"title\":\"Cucumber, with peel, raw\",\"fat\":0.178,\"protein\":0.625,\"carbs\":2.95},{\"title\":\"Cabbage, green, raw\",\"fat\":0.228,\"protein\":0.961,\"carbs\":6.38},{\"title\":\"Cabbage, red, raw\",\"fat\":0.214,\"protein\":1.24,\"carbs\":6.79},{\"title\":\"Strawberries, raw\",\"fat\":0.22,\"carbs\":7.96,\"protein\":0.641},{\"title\":\"Raspberries, raw\",\"fat\":0.188,\"carbs\":12.9,\"protein\":1.01},{\"title\":\"Blueberries, raw\",\"fat\":0.306,\"protein\":0.703,\"carbs\":14.6},{\"title\":\"Grapes, red, seedless, raw\",\"fat\":0.164,\"protein\":0.914,\"carbs\":20.2},{\"title\":\"Grapes, green, seedless, raw\",\"fat\":0.232,\"protein\":0.899,\"carbs\":18.6},{\"title\":\"Applesauce, unsweetened, with added vitamin C\",\"fat\":0.162,\"carbs\":12.3,\"protein\":0.273},{\"title\":\"Flour, amaranth\",\"fat\":6.24,\"protein\":13.2,\"carbs\":68.8},{\"title\":\"Flour, quinoa\",\"fat\":6.6,\"protein\":11.9,\"carbs\":69.5},{\"title\":\"Flour, sorghum\",\"fat\":3.59,\"protein\":8.27,\"carbs\":77.4},{\"title\":\"Flour, buckwheat\",\"fat\":2.48,\"protein\":8.88,\"carbs\":75},{\"title\":\"Flour, rye\",\"fat\":1.91,\"protein\":8.4,\"carbs\":77.2},{\"title\":\"Flour, barley\",\"fat\":2.45,\"protein\":8.72,\"carbs\":77.4},{\"title\":\"Flour, cassava\",\"fat\":0.494,\"protein\":0.918,\"carbs\":87.3},{\"title\":\"Buckwheat, whole grain\",\"fat\":3.04,\"protein\":11.1,\"carbs\":71.1},{\"title\":\"Millet, whole grain\",\"fat\":4.19,\"protein\":10,\"carbs\":74.4},{\"title\":\"Rice, brown, long grain, unenriched, raw\",\"fat\":3.31,\"protein\":7.25,\"carbs\":76.7},{\"title\":\"Rice, white, long grain, unenriched, raw\",\"fat\":1.03,\"carbs\":80.3,\"protein\":7.04},{\"title\":\"Beef, ground, 90% lean meat / 10% fat, raw\",\"fat\":12.8,\"protein\":18.2,\"carbs\":0},{\"title\":\"Beef, ground, 80% lean meat / 20% fat, raw\",\"fat\":19.4,\"protein\":17.5,\"carbs\":0},{\"title\":\"Pork, ground, raw\",\"fat\":17.5,\"protein\":17.8,\"carbs\":0},{\"title\":\"Chicken, ground, with additives, raw\",\"fat\":7.16,\"protein\":17.9,\"carbs\":0},{\"title\":\"Turkey, ground, 93% lean/ 7% fat, raw\",\"fat\":9.59,\"protein\":17.3,\"carbs\":0},{\"title\":\"Nuts, brazilnuts, raw\",\"fat\":57.4,\"protein\":15,\"carbs\":21.6},{\"title\":\"Nuts, cashew nuts, raw\",\"fat\":38.9,\"protein\":17.4,\"carbs\":36.3},{\"title\":\"Nuts, hazelnuts or filberts, raw\",\"fat\":53.5,\"protein\":13.5,\"carbs\":26.5},{\"title\":\"Peanuts, raw\",\"fat\":43.3,\"protein\":23.2,\"carbs\":26.5},{\"title\":\"Flour, chestnut\",\"fat\":4.64,\"protein\":5.29,\"carbs\":80.5},{\"title\":\"Nuts, macadamia nuts, raw\",\"fat\":64.9,\"protein\":7.79,\"carbs\":24.1},{\"title\":\"Nuts, pistachio nuts, raw\",\"fat\":45,\"protein\":20.5,\"carbs\":27.7},{\"title\":\"Seeds, pumpkin seeds (pepitas), raw\",\"fat\":40,\"protein\":29.9,\"carbs\":18.7},{\"title\":\"Seeds, sunflower seed, kernel, raw\",\"fat\":48.4,\"protein\":18.9,\"carbs\":24.5},{\"title\":\"Flour, coconut\",\"fat\":15.3,\"protein\":16.1,\"carbs\":58.9},{\"title\":\"Beans, cannellini, dry\",\"fat\":2.2,\"protein\":21.6,\"carbs\":59.8},{\"title\":\"Chickpeas, (garbanzo beans, bengal gram), dry\",\"fat\":6.27,\"carbs\":60.4,\"protein\":21.3},{\"title\":\"Lentils, dry\",\"fat\":1.92,\"protein\":23.6,\"carbs\":62.2},{\"title\":\"Blackeye pea, dry\",\"fat\":2.42,\"protein\":21.2,\"carbs\":61.8},{\"title\":\"Beans, black, canned, sodium added, drained and rinsed\",\"fat\":1.27,\"protein\":6.91,\"carbs\":19.8},{\"title\":\"Beans, navy, canned, sodium added, drained and rinsed\",\"fat\":1.4,\"protein\":6.57,\"carbs\":20},{\"title\":\"Beans, cannellini, canned, sodium added, drained and rinsed\",\"fat\":1.17,\"protein\":7.41,\"carbs\":18.8},{\"title\":\"Chickpeas (garbanzo beans, bengal gram), canned, sodium added, drained and rinsed\",\"fat\":3.1,\"protein\":7.02,\"carbs\":20.3},{\"title\":\"Beans, kidney, dark red, canned, sodium added, sugar added, drained and rinsed\",\"fat\":1.26,\"protein\":7.8,\"carbs\":21},{\"title\":\"Beans, kidney, light red, canned, sodium added, sugar added, drained and rinsed\",\"fat\":1.3,\"protein\":7.31,\"carbs\":21.4},{\"title\":\"Peas, green, sweet, canned, sodium added, sugar added, drained and rinsed\",\"fat\":1.15,\"protein\":4.73,\"carbs\":12.7},{\"title\":\"Beans, pinto, canned, sodium added, drained and rinsed\",\"fat\":1.27,\"carbs\":19.6,\"protein\":6.69},{\"title\":\"Blackeye pea, canned, sodium added, drained and rinsed\",\"fat\":1.3,\"carbs\":19.2,\"protein\":6.92},{\"title\":\"Beans, great northern, canned, sodium added, drained and rinsed\",\"fat\":1.27,\"carbs\":19.3,\"protein\":7.03},{\"title\":\"Pork, loin, boneless, raw\",\"fat\":9.47,\"protein\":21.1,\"carbs\":0},{\"title\":\"Pork, loin, tenderloin, boneless, raw\",\"fat\":3.9,\"protein\":21.6,\"carbs\":0},{\"title\":\"Chicken, breast, boneless, skinless, raw\",\"fat\":1.93,\"protein\":22.5,\"carbs\":0},{\"title\":\"Chicken, thigh, boneless, skinless, raw\",\"fat\":7.92,\"protein\":18.6,\"carbs\":0},{\"title\":\"Beef, ribeye, steak, boneless, choice, raw\",\"fat\":20,\"protein\":18.7,\"carbs\":0},{\"title\":\"Beef, round, top round, boneless, choice, raw\",\"fat\":5.7,\"protein\":21.5,\"carbs\":0.852},{\"title\":\"Beef, chuck, roast, boneless, choice, raw\",\"fat\":17.8,\"protein\":18.4,\"carbs\":0},{\"title\":\"Beef, flank, steak, boneless, choice, raw\",\"fat\":9.4,\"protein\":20.1,\"carbs\":0},{\"title\":\"Yogurt, plain, nonfat\",\"fat\":0.087,\"protein\":4.23,\"carbs\":8.08},{\"title\":\"Cheese, monterey jack, solid\",\"fat\":32.6,\"carbs\":1.9,\"protein\":22.6},{\"title\":\"Cheese, pasteurized process cheese food or product, American, singles\",\"fat\":23.9,\"carbs\":8.19,\"protein\":15.6},{\"title\":\"Cheese, provolone, sliced\",\"fat\":28.1,\"protein\":23.5,\"carbs\":2.45},{\"title\":\"Cheese, oaxaca, solid\",\"fat\":22.1,\"carbs\":2.4,\"protein\":22.1},{\"title\":\"Cheese, queso fresco, solid\",\"fat\":23.4,\"carbs\":2.96,\"protein\":18.9},{\"title\":\"Cheese, cotija, solid\",\"fat\":27.2,\"protein\":23.8,\"carbs\":2.72},{\"title\":\"Fish, salmon, sockeye, wild caught, raw\",\"fat\":4.94,\"protein\":22.3,\"carbs\":0},{\"title\":\"Fish, salmon, Atlantic, farm raised, raw\",\"fat\":13.1,\"protein\":20.3,\"carbs\":0},{\"title\":\"Fish, tilapia, farm raised, raw\",\"fat\":2.48,\"carbs\":0,\"protein\":19},{\"title\":\"Crustaceans, shrimp, farm raised, raw\",\"fat\":0.801,\"protein\":15.6,\"carbs\":0.485},{\"title\":\"Fish, cod, Atlantic, wild caught, raw\",\"fat\":0.668,\"protein\":16.1,\"carbs\":0},{\"title\":\"Fish, catfish, farm raised, raw\",\"fat\":7.31,\"protein\":16.5,\"carbs\":0},{\"title\":\"Crustaceans, crab, blue swimming, lump, pasteurized, refrigerated\",\"fat\":0.808,\"carbs\":0,\"protein\":18.6},{\"title\":\"Squash, summer, green, zucchini, includes skin, raw\",\"fat\":0.205,\"protein\":0.984},{\"title\":\"Squash, summer, yellow, includes skin, raw\",\"fat\":0.135,\"protein\":0.891},{\"title\":\"Squash, winter, butternut, raw\",\"fat\":0.168,\"protein\":1.15,\"carbs\":10.5},{\"title\":\"Squash, winter, acorn, raw\",\"fat\":0.182,\"protein\":1.25,\"carbs\":10.5},{\"title\":\"Cabbage, bok choy, raw\",\"fat\":0.234,\"protein\":1.02,\"carbs\":3.51},{\"title\":\"Cauliflower, raw\",\"fat\":0.238,\"protein\":1.64,\"carbs\":4.72},{\"title\":\"Collards, raw\",\"fat\":0.77,\"protein\":2.97,\"carbs\":7.02},{\"title\":\"Brussels sprouts, raw\",\"fat\":0.565,\"protein\":3.98,\"carbs\":9.62},{\"title\":\"Beets, raw\",\"fat\":0.302,\"carbs\":8.79,\"protein\":1.69},{\"title\":\"Eggplant, raw\",\"fat\":0.12,\"protein\":0.852,\"carbs\":5.4},{\"title\":\"Tomatoes, whole, canned, solids and liquids, with salt added\",\"fat\":0.206,\"protein\":0.868,\"carbs\":4.29},{\"title\":\"Tomato, sauce, canned, with salt added\",\"fat\":0.382,\"protein\":1.35,\"carbs\":6.33},{\"title\":\"Tomato, paste, canned, without salt added\",\"fat\":0.732,\"protein\":4.23,\"carbs\":20.2},{\"title\":\"Tomatoes, crushed, canned\",\"fat\":0.398,\"protein\":1.44,\"carbs\":7.14},{\"title\":\"Tomato, puree, canned\",\"fat\":0.265,\"protein\":1.58,\"carbs\":8.04},{\"title\":\"Apricot, with skin, raw\",\"fat\":0.405,\"protein\":0.961,\"carbs\":10.2},{\"title\":\"Melons, honeydew, raw\",\"fat\":0.216,\"protein\":0.531,\"carbs\":8.15},{\"title\":\"Plantains, ripe, raw\",\"fat\":0.893,\"protein\":1.16,\"carbs\":31},{\"title\":\"Plantains, underripe, raw\",\"fat\":0.685,\"protein\":1.23,\"carbs\":33.6},{\"title\":\"Chia seeds, dry, raw\",\"fat\":32.9,\"protein\":17,\"carbs\":38.3},{\"title\":\"Bulgur, dry, raw\",\"fat\":2.42,\"protein\":11.8,\"carbs\":75.9},{\"title\":\"Wild rice, dry, raw\",\"fat\":1.7,\"protein\":12.8,\"carbs\":75.7},{\"title\":\"Arugula, baby, raw\",\"fat\":0.325,\"protein\":1.65,\"carbs\":5.37},{\"title\":\"Asparagus, green, raw\",\"fat\":0.216,\"protein\":1.44,\"carbs\":5.1},{\"title\":\"Avocado, Hass, peeled, raw\",\"fat\":20.3,\"protein\":1.81,\"carbs\":8.32},{\"title\":\"Rice, black, unenriched, raw\",\"fat\":3.44,\"protein\":7.57,\"carbs\":77.2},{\"title\":\"Corn, sweet, yellow and white kernels,  fresh, raw\",\"fat\":1.63,\"protein\":2.79,\"carbs\":14.7},{\"title\":\"Einkorn, grain, dry, raw\",\"fat\":3.81,\"protein\":15.1,\"carbs\":68.7},{\"title\":\"Farro, pearled, dry, raw\",\"fat\":3.1,\"protein\":12.6,\"carbs\":72.1},{\"title\":\"Fonio, grain, dry, raw\",\"fat\":1.69,\"protein\":7.17,\"carbs\":81.3},{\"title\":\"Khorasan, grain, dry, raw\",\"fat\":2.8,\"protein\":14.8,\"carbs\":71.8},{\"title\":\"Kiwifruit (kiwi), green, peeled, raw\",\"fat\":0.64,\"protein\":1.01,\"carbs\":13.8},{\"title\":\"Mandarin, seedless, peeled, raw\",\"fat\":0.458,\"protein\":1.04,\"carbs\":13.4},{\"title\":\"Mango, Tommy Atkins, peeled, raw\",\"fat\":0.572,\"protein\":0.562,\"carbs\":15.3},{\"title\":\"Mango, Ataulfo, peeled, raw\",\"fat\":0.681,\"protein\":0.688,\"carbs\":17.4},{\"title\":\"Corn flour, masa harina, white or yellow, dry, raw\",\"fat\":4.34,\"protein\":7.56,\"carbs\":76.7},{\"title\":\"Pear, Anjou, green, with skin, raw\",\"fat\":0.371,\"protein\":0.312,\"carbs\":14.8},{\"title\":\"Plum, black, with skin, raw\",\"fat\":0.282,\"protein\":0.578,\"carbs\":13.5},{\"title\":\"Rice, red, unenriched, dry, raw\",\"fat\":3.44,\"protein\":8.56,\"carbs\":76.2},{\"title\":\"Sorghum bran, white, unenriched, dry, raw\",\"fat\":9.26,\"protein\":11.2,\"carbs\":68.7},{\"title\":\"Sorghum flour, white, pearled, unenriched, dry, raw\",\"fat\":3.24,\"protein\":10.2,\"carbs\":73.5},{\"title\":\"Sorghum grain, white, pearled, unenriched, dry, raw\",\"fat\":3.26,\"protein\":10.2,\"carbs\":74.9},{\"title\":\"Sorghum, whole grain, white, dry, raw\",\"fat\":4.22,\"carbs\":73.6,\"protein\":10.1},{\"title\":\"Plantains, overripe, raw\",\"fat\":0.99,\"protein\":1.17,\"carbs\":29.2}]")


                }
        }

    }


}


