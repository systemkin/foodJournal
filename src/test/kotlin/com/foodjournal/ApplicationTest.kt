package com.foodjournal

import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.config.*
import io.ktor.server.config.yaml.*
import io.ktor.server.testing.*
import org.openqa.selenium.WebDriver
import org.openqa.selenium.chrome.ChromeDriver
import kotlin.test.*
import java.time.Duration
import org.openqa.selenium.By
class ApplicationTest {


    @Test
    fun testTest() = testApplication {
        environment {
            config = ApplicationConfig("application-test.yaml")
        }
        //application {
          //  module()
        //}

        val driver: WebDriver = ChromeDriver()
        driver.get("https://www.selenium.dev/selenium/web/web-form.html")

        val title = driver.title
        assertEquals("Web form", title)
        driver.manage().timeouts().implicitlyWait(Duration.ofMillis(500))

        var textBox = driver.findElement(By.name("my-text"))
        val submitButton = driver.findElement(By.cssSelector("button"))

        textBox.sendKeys("Selenium")
        submitButton.click()

        val message = driver.findElement(By.id("message"))
        val value = message.getText()
        assertEquals("Received!", value)

        driver.quit()
    }

}