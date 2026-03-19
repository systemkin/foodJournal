ingredients = new Map();
nutrients = new Map();
nutrientsSet = new Set();
totalFoodNutrients = new Map();
nutrientsSequence = 0;
ingredientsSequence = 0;
dailyGoals = [];
unitsMap = new Map();
starredNow = false; // can be stored as data of button itself



function createClipPath(part) {
    res = "polygon(50% 50%, 50% 0%"
    part = 1-part
    //if we got 0.3 then it becomes 0.7 - part of a circle to hide

    //We have 4 diagonals on a cube, each "if" hooks onto nearest next (if we moving through cube clockwise) diagonale.
    // angle 1 - angle between diagonale and cut line (not that on 0 degrees, or we would know it - 45, 135...)
    //angle 2 - angle between cut line and cube side
    //side1/2 - opposing sides.
    // side 1 represents side of cube, so we need to find it
    if (part >= 0.875) { //between N line and NE diagonal
        angle1 = 4*(part-0.875)*(Math.PI/2) 
        angle2 = Math.PI-(angle1) - Math.PI/4
        
        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ", " + (50+(50-(side1*100))) + "% 0%)"
        return res
    }
    if (part >= 0.625)  { //between NE and SE
        angle1 = 4*(part-0.625)*(Math.PI/2)
        angle2 = Math.PI-(angle1) - Math.PI/4
        
        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ",100% 0%, 100% " + Math.abs(100-side1*100) + "%)"
        return res

    }
    if (part >= 0.375)  {
        angle1 = 4*(part-0.375)*(Math.PI/2)
        angle2 = Math.PI-(angle1) - Math.PI/4

        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ",100% 0%, 100% 100%, " + side1*100 + "% 100%)"
        return res
    }
    if (part >= 0.125) {
        angle1 = 4*(part-0.125)*(Math.PI/2)
        angle2 = Math.PI-(angle1) - Math.PI/4
        
        side2 = Math.sqrt(2)/2
        side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

        res += ",100% 0%, 100% 100%, 0% 100%, 0% " + side1*100 + "%)"
        return res
    }

    //same, but we anchors not onto diagonal but onto straight line at start, or 'N'
    angle1 = 4*(part)*(Math.PI/2)
    angle2 = Math.PI-(angle1) - Math.PI/2
        
    side2 = 0.5
    side1 = (side2 * Math.sin(angle1)) / (Math.sin(angle2))

    res += ",100% 0%, 100% 100%, 0% 100%, 0% 0%," + (0.5-side1)*100 + "% 0%)"
    return res
}

//


async function fetchUserInfo() {
    try {
        const response = await fetch("userinfo")
        const result = await response.json()
        document.getElementById("nicknameHolder").innerHTML = result.name
    } catch (error) {
        console.error("Error fetching data:", error)
    }
}
async function fetchDailyGoals() {
    try {
        const response = await fetch("dailygoals")
        const result = await response.json()
        if (result.length == 0)
            document.getElementById("todayTopNutrient").innerHTML = "No goals yet"
        else {
            dailyGoals = result;
            if (result != {}) {
                for (i = 0; i < result.length; i++) {
                    unitsMap.set(result[i].nutrient.name, result[i].nutrient.unitName);
                }
                
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error)
    }
}
async function setCurrentTimeAsMealTime() {
    now = new Date()
    offset = now.getTimezoneOffset() * 60000
    localTime = new Date(now.getTime() - offset)
    localTime = localTime.toISOString().slice(0, 16)
    document.getElementById("mealTime").value = localTime

}

function redirectToJournal() {
    window.location.href = "journal.html"
}

async function changeStarring() {
    starredNow = !starredNow;
    if (starredNow)
        document.getElementById("star").src = "assets/images/filledStar.png"
    else document.getElementById("star").src = "assets/images/emptyStar.png"
}
async function logoff() {
    await fetch("/logoff") 
    window.location.href = "/login.html"
}

async function showAddIngredientWindow() {
    nutrientsSequence = 0;
    document.body.style.overflow = "clip";
    document.body.insertAdjacentHTML('beforeend', `
    <div id = "addIngredientWindow" class= "centralWindow backgroundColor flexer column flexHolder" style =  "height: 100%;">
        <div  class = "backgroundColor"style="position: fixed; display: flex; flex-direction:column;top: 0px; left: 0px; width:101%; height: 101vh; height : 100dvh">
            <div class = "text grayT paddingHigh">
                    Adding ingredient
                </div>
            <div class="horizontalDivider grayBG"></div>
            <div class = "clickablePlate clickablePlateColor" style = "margin-top:30px; margin-bottom: 30px;">
                <div class = "left text grayT">Name</div>
                <input list="suggestions3" oninput="descriptionChanged()" placeholder="optional" id="ingredientDescription" class = "clickablePlateColor center text whiteT hoverable grayHover paddingLow" style = "text-align:end; border:none; font-family: 'Lexend Deca'">
            </div>
            <datalist id="suggestions3">
            </datalist>   
            <div class = "clickablePlate clickablePlateColor" style = "margin-top:30px; margin-bottom: 30px;">
                <div class = "left text grayT">Grams</div>
                <input placeholder="100.0" type="number" step="any" id="unitsAmount" class = "clickablePlateColor center text whiteT hoverable grayHover paddingLow" style = "text-align:end; border:none; font-family: 'Lexend Deca'">
            </div>  
            <div class="horizontalDivider grayBG"></div>
            <div class = "flexer row space-between">
                <div class = "text grayT paddingHigh">
                    Nutrients per 100g
                </div>
                <div onclick = "loadFromDb()" class = "flexer text whiteT textButton" style = "align-items: center; text-align:center">
                    Load from database
                </div>
                <div onclick = "loadIngredientFromStarred()" class = "flexer text whiteT textButton" style = "align-items: center; text-align:center">
                    Load from starred
                </div>  
                <input type="file" id="barcodeImageInput" accept="image/*" />
            </div>
            <div class = "noPadding clickablePlate clickablePlateColor ">
                <div onclick="showAddNutrient()" class = "center text backgroundT fontBig textButton noPadding" style = "align-items: center">+</div>
            </div>
            <div id = "nutrientsTable" class = "flexer column flexHolder"  style = "overflow: scroll">
            </div>
            <div class="horizontalDivider grayBG"></div>
            <div class = "flexer row space-between">
                <div onclick = "closeAddIngredientWindow()" class = "flexer text whiteT textButton" style = "align-items: center">
                    Cancel
                </div> 
                <div onclick = "confirmAddIngredientWindow()" class = "flexer text whiteT textButton" style = "align-items: center">
                    Confirm
                </div>  
            </div>
        </div>
    </div>
    `)

    document.getElementById('barcodeImageInput').addEventListener('change', function(event) {
        debugger;
        const objectUrl = URL.createObjectURL(event.target.files[0]);
        Quagga.decodeSingle({
            decoder: {
                readers: [
                "ean_reader",   
                "upc_reader", 
                "ean_8_reader", 
                "upc_e_reader" 
            ]
            },
            locate: true,
            src: objectUrl
        }, function(result) {
            if (result?.codeResult) {
                console.log("Barcode detected:", result.codeResult.code);
                fetch("https://world.openfoodfacts.org/api/v0/product/" + result.codeResult.code).then(response => {
                    response.json().then(json => {
                        console.log('info:' + JSON.stringify(json));
                    })
                })
                
            } else {
                console.log("No barcode detected.");
            }
        });
    });

}


function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const searchStarred = debounce(async (query) => {
    if (!query) return;
    
    try {
        const [mealsResponse] = await Promise.all([
            fetch("/meals/search?description=" + encodeURIComponent(query)+ "&starred=true"),
        ]);
        
        const mealsData = await mealsResponse.json();

        let suggestions = "";
        
        mealsData.forEach(item => {
            suggestions += `<option value='` + item.description + `'>`;
        });
        
        if (suggestions) {
            document.getElementById("suggestions0").innerHTML = suggestions;
        }
    } catch (error) {
        console.error('Error building suggestions:', error);
    }
}, 1000);

async function descriptionMealChanged() {
    query = document.getElementById("mealDescription").value;
    searchStarred(query);
}

const searchSuggestions = debounce(async (query) => {
    if (!query) return;
    
    try {
        const [mealsResponse, foodsResponse] = await Promise.all([
            fetch("/meals/search?description=" + encodeURIComponent(query)+ "&starred=true"),
            fetch("/foodsdb?name=" + encodeURIComponent(query) )
        ]);
        
        const mealsData = await mealsResponse.json();
        const foodsData = await foodsResponse.json();
        
        let suggestions = "";
        
        mealsData.forEach(item => {
            suggestions += `<option value='` + item.description + `'>`;
        });
        
        foodsData.forEach(item => {
            suggestions += `<option value='` + item.description + `'>`;
        });
        
        if (suggestions) {
            document.getElementById("suggestions3").innerHTML = suggestions;
        }
    } catch (error) {
        console.error('Error building suggestions:', error);
    }
}, 1000);
async function descriptionChanged() {
    query = document.getElementById("ingredientDescription").value;

    searchSuggestions(query);
}
async function closeAddIngredientWindow() {
    document.getElementById("addIngredientWindow").remove();
    document.body.style.overflow = "unset";
    nutrients.clear();
    nutrientsSet.clear();
}
async function showAddNutrient(){
    document.body.insertAdjacentHTML('beforeend', `
    <div id="nutrientWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
        <div style="background-color: #5C5C5C; border-radius: 30px; padding: 20px">
            <div class = "flexer column" > 
                <input onchange="manageUnit()" placeholder="Name" id="nutrientName" list="suggestions" class = "placeholderGray  center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 30px;  border:4px solid #1e1e1e; border-radius:10px;  font-family: 'Lexend Deca'">
                <datalist id="suggestions">
                    ` + buildSuggestions() + `
                </datalist>
                <div class = "flexer row" style = "align-items: center">
                    <input onclick="manageUnit()" placeholder="Amount" type="number" id="nutrientAmount" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 30px;  border:4px solid #1e1e1e; border-radius:10px; font-family: 'Lexend Deca'">
                    <input list="suggestionsUnit" placeholder="Unit"  id="nutrientUnit" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = "width: 100px;background-color: #5C5C5C;margin: 30px;  border:4px solid #1e1e1e; border-radius:10px; font-family: 'Lexend Deca'">
                    <datalist id="suggestionsUnit">
                    </datalist>
                </div>
                <div class = "flexer row space-between">
                    <div onclick = "closeAddNutrient()" class = "flexer text whiteT textButton" style = "align-items: center">
                        Cancel
                    </div> 
                    <div onclick = "confirmAddNutrient()" class = "flexer text whiteT textButton" style = "align-items: center">
                        Confirm
                    </div>  
                </div>
            </div>
        </div>
    </div> 
    `);
}

function buildSuggestions() {
    result = "";
    for (i = 0; i < dailyGoals.length; i++) {
        result += " <option value='" + dailyGoals[i].nutrient.name + "'>";
    }
    return result;
}

async function closeAddNutrient() {
    document.getElementById("nutrientWindow").remove();
}

async function confirmAddNutrient() {
    name = document.getElementById("nutrientName").value;
    if (name == "") name = "No name";
    amount = document.getElementById("nutrientAmount").value;
    unit = unitsMap.get(name)
    if (unit === undefined) {
        alert("This nutrient is not tracked now. If you want to track it add it on journal page.");
        return;
    }
    if (nutrientsSet.has(name)) {
        alert("Duplicated nutrient.");
        return;
    }
    nutrient = {name, "unitName":unit}
    nutrients.set(nutrientsSequence, { amount, nutrient });
    nutrientsSet.add(nutrient.name);
    document.getElementById("nutrientsTable").innerHTML += `
        <div id = n_`+nutrientsSequence+` class = "flexer row space-between clickablePlate clickablePlateColor" style = "padding-left: 10px; padding-right: 10px;">
            <div class = "text grayT fontMid noPadding">`+ name +`</div>
            <div class = "flexer row">
                <div class = "text grayT fontMid noPadding">`+amount+ " " + unit + `</div>
                <div onclick="editNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">E</div>
                <div onclick="deleteNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">X</div>
            </div>
        </div>
    `
    nutrientsSequence++;
    document.getElementById("nutrientWindow").remove();
}
async function deleteNutrient(nutrientsNumber) {
    document.getElementById("n_"+nutrientsNumber).remove();
    nutrientsSet.delete(nutrients.get(nutrientsNumber).nutrient.name);
    nutrients.delete(nutrientsNumber);
    
}
async function deleteIngredient(ingredientNumber) {
    document.getElementById("i_"+ingredientNumber).remove();
    ingredients.delete(ingredientNumber);
}
async function editNutrient(nutrientNumber) {
    document.body.insertAdjacentHTML('beforeend', `
    <div data-nnum = "`+nutrientNumber+`" id="nutrientEditWindow" style="display:flex; width:100%;height: 100%;position: absolute;justify-content: center;align-content: center;align-items: center;"> 
        <div style="background-color: #5C5C5C; border-radius: 30px; padding: 20px">
            <div class = "flexer column" > 
                <input onchange="manageUnit()" placeholder="Name" id="nutrientName" list="suggestions" class = "placeholderGray  center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 30px;  border:4px solid #1e1e1e; border-radius:10px;  font-family: 'Lexend Deca'">
                <datalist id="suggestions">
                    ` + buildSuggestions() + `
                </datalist>
                <div class = "flexer row" style = "align-items: center">
                    <input onclick="manageUnit()" placeholder="Amount" type="number" id="nutrientAmount" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = "background-color: #5C5C5C;margin: 30px;  border:4px solid #1e1e1e; border-radius:10px; font-family: 'Lexend Deca'">
                    <input list="suggestionsUnit" placeholder="Unit"  id="nutrientUnit" class = "placeholderGray center text whiteT hoverable grayHover paddingLow" style = " width: 100px; background-color: #5C5C5C;margin: 30px;  border:4px solid #1e1e1e; border-radius:10px; font-family: 'Lexend Deca'">
                    <datalist id="suggestionsUnit">
                    </datalist>
                </div>

                <div class = "flexer row space-between">
                    <div onclick = "closeEditNutrient()" class = "flexer text whiteT textButton" style = "align-items: center">
                        Cancel
                    </div> 
                    <div onclick = "confirmEditNutrient(`+ nutrientNumber +`)" class = "flexer text whiteT textButton" style = "align-items: center">
                        Confirm
                    </div>  
                </div>
            </div>
        </div>
    </div>
    `);

    nutrientsSet.delete(nutrients.get(nutrientNumber).nutrient.name);
    document.getElementById("nutrientName").value = nutrients.get(nutrientNumber).nutrient.name;
    document.getElementById("nutrientAmount").value = nutrients.get(nutrientNumber).amount; 
    document.getElementById("nutrientUnit").value = nutrients.get(nutrientNumber).nutrient.unitName; 
    manageUnit(); 
    
}
async function manageUnit() {

    let suggestions = document.getElementById("suggestionsUnit");
    var nutrientName = document.getElementById("nutrientName").value;
    await defaultNutrientsPromise;
    result = "";
    var units = defaultUnitsMap.get(nutrientName)
    if (units != undefined) {
        for (i = 0; i < units.length; i++) {
            result += " <option value='" + units[i] + "'></option>";
        }
        suggestions.innerHTML = result;
    }
    if (unitsMap.get(nutrientName) === undefined) { 
        if (units === undefined) document.getElementById("nutrientUnit").value = "";
        else document.getElementById("nutrientUnit").value = units[0]
        return;
    }
    suggestions.innerHTML += `<option value = "`+ unitsMap.get(nutrientName)+`"></option>`;
    document.getElementById("nutrientUnit").value = unitsMap.get(nutrientName);
   
    
}
async function closeEditNutrient() {
    nutrientsSet.add(nutrients.get(parseInt(document.getElementById("nutrientEditWindow").dataset.nnum)).nutrient.name);
    document.getElementById("nutrientEditWindow").remove();
}
async function confirmEditNutrient(nutrientNumber) {


    name = document.getElementById("nutrientName").value;
    if (name == "") name = "No name";
    amount = document.getElementById("nutrientAmount").value;
    unitName =  document.getElementById("nutrientUnit").value;
    
    /*
     if (unitName === undefined) {
        alert("This nutrient is not tracked now. If you want to track it add it on journal page.");
        return;
    }
    if (nutrientsSet.has(name)) {
        alert("Duplicated nutrient.");
        return;
    } */
    nutrient = {name, unitName}
    nutrients.set(nutrientNumber, { amount, nutrient });
    nutrientsSet.add(nutrient.name);
    document.getElementById("n_"+nutrientNumber).innerHTML = `
        <div class = "text grayT fontMid noPadding">`+ name +`</div>
        <div class = "flexer row">
            <div class = "text grayT fontMid noPadding">`+amount+ " " + unitName + `</div>
            <div onclick="editNutrient(`+nutrientNumber+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">E</div>
            <div onclick="deleteNutrient(`+nutrientNumber+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">X</div>
        </div>
    `
    document.getElementById("nutrientEditWindow").remove();
}
async function confirmAddIngredientWindow() {
    ingredient = Array.from(nutrients.values());
    nutrientsSequence = 0;
    
    ingredientName = document.getElementById("ingredientDescription").value;
    units = document.getElementById("unitsAmount").value;
    if (units == 0) {units = 100;}
    units /= 100;

    ingredients.set(ingredientsSequence, {"name":ingredientName, "units":units, "nutrientsPUnit": ingredient});
    
    if (ingredientName == "") {ingredientName = "No name"}

    amount = ingredient[0].amount*units;
    bestNutrientName = ingredient[0].nutrient.name;
    unitBest = ingredient[0].nutrient.unitName;
    for (i = 0; i < ingredient.length; i++) {
        if (ingredient[i].nutrient.name == getFirstGoal().name && ingredient[i].nutrient.unitName == getFirstGoal().unitName) {
            bestNutrientName = ingredient[i].nutrient.name;
            amount = ingredient[i].amount*units;
            unitBest = ingredient[i].nutrient.unitName;
            break;
        }
    }

    document.getElementById("plate").innerHTML += `
        <div id = "i_`+ ingredientsSequence +`" class="flexer column clickablePlateColor" style = "padding: 20px; margin-top: 10px">
            <div class="flexer row space-between">
                <div class = "flexer text grayT" style = "align-items: center;">
                    ` + ingredientName + `
                </div>
                <div onclick ="editIngredient(`+ ingredientsSequence +`)" class="text backgroundT fontMid" style="margin-left: 40px;">E</div>
                <div onclick ="deleteIngredient(`+ ingredientsSequence +`)" class="text backgroundT fontMid" style="margin-left: 40px;">X</div>
            </div>
            <div class="flexer row space-between" style = "margin-top: 20px">
                <div class = "flexer text grayT" style = "align-items: center;">
                    ` + bestNutrientName + `
                </div>
                <div class="text grayT fontMid" style="margin-left: 40px;">` + amount + " " + unitBest + `</div>
            </div>
        </div>
    `
    ingredientsSequence++;
    closeAddIngredientWindow();
}

async function confirmEditIngredientWindow(number) {

    var ingredient = Array.from(nutrients.values());
    nutrientsSequence = 0;
    
    ingredientName = document.getElementById("ingredientDescription").value;
    units = document.getElementById("unitsAmount").value;
    if (units == 0) {units = 100;}
    units /= 100;

    ingredients.set(number, {"name":ingredientName, "units":units, "nutrientsPUnit": ingredient});
    
    if (ingredientName == "") {ingredientName = "No name"}

    amount = ingredient[0].amount*units;
    bestNutrientName = ingredient[0].nutrient.name;
    unitBest = ingredient[0].nutrient.unitName;
    for (i = 0; i < ingredient.length; i++) {
        if (ingredient[i].nutrient.name == getFirstGoal().name && ingredient[i].nutrient.unitName == getFirstGoal().unitName) {
            bestNutrientName = ingredient[i].nutrient.name;
            amount = ingredient[i].amount*units;
            unitBest = ingredient[i].nutrient.unitName;
            break;
        }
        
    }
    document.getElementById("i_" + number).innerHTML = `
            <div class="flexer row space-between">
                <div class = "flexer text grayT" style = "align-items: center;">
                    ` + ingredientName + `
                </div>
                <div onclick ="editIngredient(`+ number +`)" class="text backgroundT fontMid" style="margin-left: 40px;">E</div>
                <div onclick ="deleteIngredient(`+ number +`)" class="text backgroundT fontMid" style="margin-left: 40px;">X</div>
            </div>
            <div class="flexer row space-between" style = "margin-top: 20px">
                <div class = "flexer text grayT" style = "align-items: center;">
                    ` + bestNutrientName + `
                </div>
                <div class="text grayT fontMid" style="margin-left: 40px;">` + amount + " " + unitBest + `</div>
            </div>
    `
    closeAddIngredientWindow();
}

async function editIngredient(ingredientNumber)  {
    nutrientsSequence = 0;
    document.body.insertAdjacentHTML('beforeend', `
    <div id = "addIngredientWindow" class = "backgroundColor"style="position: absolute; display: flex; flex-direction:column;top: 0px; left: 0px; width:100%; height : 100vh; height : 100dvh">
        <div class = "text grayT paddingHigh">
                Editing ingredient ` + ingredients.get(ingredientNumber).name + `
            </div>
        <div class="horizontalDivider grayBG"></div>
        <div class = "clickablePlate clickablePlateColor" style = "margin-top:30px; margin-bottom: 30px;">
            <div class = "left text grayT">Name</div>
            <input placeholder="optional" id="ingredientDescription" class = "clickablePlateColor center text whiteT hoverable grayHover paddingLow" style = "text-align:end; border:none; font-family: 'Lexend Deca'">
        </div>   
        <div class = "clickablePlate clickablePlateColor" style = "margin-top:30px; margin-bottom: 30px;">
            <div class = "left text grayT">Grams</div>
            <input placeholder="100.0" type="number" step="any" id="unitsAmount" class = "clickablePlateColor center text whiteT hoverable grayHover paddingLow" style = "text-align:end; border:none; font-family: 'Lexend Deca'">
        </div>  
        <div class="horizontalDivider grayBG"></div>
        <div class = "flexer row space-between">
            <div class = "text grayT paddingHigh">
                Nutrients per 100g
            </div>
            <div onclick = "loadFromDb()" class = "flexer text whiteT textButton" style = "align-items: center; text-align:center">
                Load from database
            </div>
            <div onclick = "loadIngredientFromStarred()" class = "flexer text whiteT textButton" style = "align-items: center; text-align:center ">
                Load from starred
            </div>    
        </div>
        <div class = "noPadding clickablePlate clickablePlateColor ">
            <div onclick="showAddNutrient()" class = "center text backgroundT fontBig textButton noPadding" style = "align-items: center">+</div>
        </div>
        <div id = "nutrientsTable" class = "flexer column flexHolder" style = "overflow: scroll">
        </div>
        <div class="horizontalDivider grayBG"></div>
        <div class = "flexer row space-between">
            <div onclick = "closeAddIngredientWindow()" class = "flexer text whiteT textButton" style = "align-items: center">
                Cancel
            </div> 
            <div onclick = "confirmEditIngredientWindow(`+ ingredientNumber +`)" class = "flexer text whiteT textButton" style = "align-items: center">
                Confirm
            </div>  
        </div>
    </div>
    `);
    ingredient = ingredients.get(ingredientNumber);
    document.getElementById("ingredientDescription").value = ingredient.name;
    document.getElementById("unitsAmount").value = ingredient.units*100;
    nutrientsSequence = 0;
    for (i = 0; i < ingredient.nutrientsPUnit.length; i++) {
        name = ingredient.nutrientsPUnit[i].nutrient.name;
        amount = ingredient.nutrientsPUnit[i].amount;
        unitName = ingredient.nutrientsPUnit[i].nutrient.unitName;
        document.getElementById("nutrientsTable").innerHTML += `
        <div id = n_` + nutrientsSequence + ` class = "flexer row space-between clickablePlate clickablePlateColor" style = "padding-left: 10px; padding-right: 10px;">
            <div class = "text grayT fontMid noPadding">`+ name +`</div>
            <div class = "flexer row">
                <div class = "text grayT fontMid noPadding">`+amount + " " + unitName +`</div>
                <div onclick="editNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">E</div>
                <div onclick="deleteNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">X</div>
            </div>
        </div>
        `;


        unitName = ingredient.nutrientsPUnit[i].nutrient.unitName;
        nutrient = {name, unitName}
        nutrients.set(nutrientsSequence, { amount, nutrient });
        nutrientsSet.add(nutrient.name);
        nutrientsSequence++;



    }
}
async function loadFromStarred() {
    var name = document.getElementById("mealDescription").value;
    if (name == "") {
        alert("Need description");
        return;
    }
    fetch("/meals/search?description=" + encodeURIComponent(name) + "&starred=true").then(response =>  {
        response.json().then(async (json) => {
            if (json.length == 0 ){
                alert("No foods found");
                return;
            } else if (json.length > 1) {
                alert("More than 1 food fount, please elaborate");
                return;
            } else {
                document.getElementById("plate").innerHTML = "";
                ingredientsSequence = 0;
                var meal = json[0];
                for (var i = 0; i < meal.ingredients.length; i++) {
                    await addIngredient(meal.ingredients[i]);
                }
                
            }
        });
    });
}
function loadIngredientFromStarred() {
    var name = document.getElementById("ingredientDescription").value;
    if (name == "") {
        alert("Need name");
        return;
    }
    fetch("/meals/search?description=" + encodeURIComponent(name) + "&starred=true").then(response => {
        response.json().then(json => {

            if (json.length == 0 ){
                alert("No foods found");
                return;
            } else if (json.length > 1) {
                alert("More than 1 food fount, please elaborate");
                return;
            } else {
                document.getElementById("nutrientsTable").innerHTML = "";
                nutrientsSequence = 0;
                var a = json[0];
                countMeals([json[0]]).then(res => {
                    res.forEach((value, key) => {
                        arr = key.split("|")
                        name = arr[0]
                        amount = value
                        unit = arr[1];
                        nutrient = {name, "unitName":unit}
                        nutrients.set(nutrientsSequence, { amount, nutrient });
                        nutrientsSet.add(name);
                        document.getElementById("nutrientsTable").innerHTML += `
                            <div id = n_`+nutrientsSequence+` class = "flexer row space-between clickablePlate clickablePlateColor" style = "padding-left: 10px; padding-right: 10px;">
                                <div class = "text grayT fontMid noPadding">`+ name +`</div>
                                <div class = "flexer row">
                                    <div class = "text grayT fontMid noPadding">`+amount+ " " + unit + `</div>
                                    <div onclick="editNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">E</div>
                                    <div onclick="deleteNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">X</div>
                                </div>
                            </div>
                        `
                        nutrientsSequence++;




                    })
                })
                
            }
        });
    });
}
function loadFromDb() {
    var name = document.getElementById("ingredientDescription").value;
    fetch("/foodsdb/full?name=" + encodeURIComponent(name)).then(response => {
        response.json().then(json => {

            if (json.length == 0 ){
                alert("No foods found");
                return;
            } else if (json.length > 1) {
                alert("More than 1 food fount, please elaborate");
                return;
            } else {
                document.getElementById("nutrientsTable").innerHTML = "";
                nutrientsSequence = 0;
                for(var i = 0; i < json[0].foodNutrients.length; i++) {
                    nutrientDb = json[0].foodNutrients[i] 
                    name = nutrientDb.nutrient.name
                    amount = nutrientDb.amount
                    unit = nutrientDb.nutrient.unitName;
                    nutrient = {name, "unitName":unit}
                    nutrients.set(nutrientsSequence, { amount, nutrient });
                    nutrientsSet.add(nutrient.name);
                    document.getElementById("nutrientsTable").innerHTML += `
                        <div id = n_`+nutrientsSequence+` class = "flexer row space-between clickablePlate clickablePlateColor" style = "padding-left: 10px; padding-right: 10px;">
                            <div class = "text grayT fontMid noPadding">`+ name +`</div>
                            <div class = "flexer row">
                                <div class = "text grayT fontMid noPadding">`+amount+ " " + unit + `</div>
                                <div onclick="editNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">E</div>
                                <div onclick="deleteNutrient(`+nutrientsSequence+`)"class = "text backgroundT fontMid" style = "margin-left: 40px;">X</div>
                            </div>
                        </div>
                    `
                    nutrientsSequence++;
                }
            }
        });
    });
}

function multiplyIngredient(ingredient, factor) {
    for(i=0; i<ingredient.length; i++) {
        ingredient[i].amount *= factor;
    }
    return ingredient;
    
}
function getFirstGoal() {
    if (dailyGoals[0] != null)
        return dailyGoals[0].nutrient;
    else return null;
}

async function readFile(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = function(evt) {
            resolve(evt.target.result);
        };
        
        reader.onerror = function() {
            reject(reader.error);
        };
        
        reader.readAsDataURL(file);
    });
}
async function confirmMeal() {

    totalUnits = document.getElementById("totalUnits").value;
    eatenUnits = document.getElementById("eatenUnits").value;
    if (totalUnits == "") totalUnits = 100;
    if (eatenUnits == "") eatenUnits = 100;
    totalUnits /= 100;
    eatenUnits /= 100;
    time = document.getElementById("mealTime").value;
    description = document.getElementById("mealDescription").value;
    imagesArr = document.getElementById("filePicker").files;
    images = [/*No image*/ "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAQ3SURBVGhD7ZhZKDZRGMffC7cu3EmUcEGEKCRClqxXRFHWlDvJha2UQhRFsl8IkTuUEiVrsmW/ELJFyFpk5/n6P/VO78w3+eYLY2j+pXmfs4zzm+ec5zznGOiXyCAt+KnSQbQmHURr0kG0pt8Ncnt7S5WVlZSTk0PX19dC+fb2NiUmJtLQ0JCovRYkC4LBp6enk4WFBTU0NNDj4yOXr6yskIODA7W3t0u7fLveBTE3Nyd3d3eanp7mcinI6+srnZyc0MzMDI2Pj7PHXl5eJG9TR++ChIeHU0xMDGVlZdH9/f1fIBsbGxQfH8+eMzMzo8DAQIb6Dr0LkpaWRpOTkxQcHEwdHR00Pz8vAqmurma7qamJ+vr6KCgoiPtcXFxIX/nlehckIyOD7ZKSEnJ1daXOzk4RCOqTkpLo/Pyc7bq6OvLx8aGtrS3R+9SQIpDNzU2KioqisLAwsrGxEYEkJyfT5eUl2y0tLeTh4cFTTm0pAoGwmO3s7HgtGEHy8vLI29ubVldXuU9KSgpFR0fT0dGRydvUkWIQhOCioiIRyMjICHl6ejKMr68ve6OtrU0I12pKFgQRCou3v79fVL6zs0MVFRW0vLzM9vPzM0ey2tpaKi0t5Y3y6elJ1EctyYL8ROkgWpMOojX9bpDT01PKzc3llOSnSBYEGyKSxImJCWmVZiUL8vDwwJve3t4e23jCRs6FVGVtbY137/39fZFtFHKvhYUFrltcXKSbmxuhDh8JdTjjILkcHR2lq6srrsNmijMNPuDc3JyQwymRLAgGGBoayrs1hKezszOnIUhRnJycqLGxkeLi4gS7t7eXd3qoqqqK7O3tydramp/19fVcjiM06mxtbcnFxYXPLwaDgWEgHBnwP6ysrLhfcXExZxlKpBjE0tKSBzE4OMhZMAZTU1PDdmRkJGfHh4eH3H52dpYGBgb4ifwM70J6A68i8SwoKGBPlZWVCSDwaGpqKsXGxtLY2Bh1d3dTQEAADQ8PS0YnL8UgODTt7u4Ktum5A+m7o6MjTzEIUwXTZ2pqis/8fn5+/BsDNvWAqY2P4O/vT/n5+UJbJKPI7ZRIMQhslMvZyIZx4EICifWUmZlJCQkJnEHDU25ubv8EOTg44IEDGv3wB08jm1aiTwdB1oy5v7S0xHWYJjgqAwQLHBcaXV1dXIe2RhAEhJCQEMrOzqazszO2jTNAiT4dZH19nb8k/jDnIyIi+CYGIMfHx3ym9/Ly4rMO2ph6CAEEbbHg8THgWXhKiWRBpPsInrCNl3VSG4sYZxJcDUG4ScHFRHl5ObdrbW0VBoRnc3Mzz330MQW5u7vj36hD//+5kZEF+Soh/Pb09PCUgvcKCws5zOL3R6UqCG5bEJUQujEVEekQ8eCJj0pVkLe3N4bB/oIphIDwGRCQqiBfKR1Ea9JBtCYdRGvSQbQmHURr+jUgfwA7FenjxaAAFQAAAABJRU5ErkJggg=="];
    if (editMode) {
        images[0] = oldImage;
    }
    if (imagesArr.length !== 0) {
        const contents = await readFile(imagesArr[0]); 
        images[0] = contents
    }
    if (editMode) {
        try {
        const response = await fetch("meals", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({id:idToEdit, description, "starred":starredNow, time, "ingredients":Array.from(ingredients.values()), "images":images, totalUnits, eatenUnits})
        })
        const result = await response.text()

        if (response.status == 200) {
            alert("Saved");
            redirectToJournal();
            /*
            document.getElementById("plate").innerHTML = "";
            ingredients.clear();
            editMode = false;
            */
        } else {
            alert("Cant save another starred meal with same description")
        }
        } catch (error) {
            console.error("Error sending data:", error)
        }
    }
    else {
        try {
            const response = await fetch("meals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({description, "starred":starredNow, time, "ingredients":Array.from(ingredients.values()), "images":images, totalUnits, eatenUnits})
            })
            const result = await response.text()

            if (response.status == 201) {
                alert("Saved");
                document.getElementById("plate").innerHTML = "";
                ingredients.clear();
            } else {
                alert("Cant save another starred meal with same description")
            }
            
            
        } catch (error) {
            console.error("Error sending data:", error)
        }
    }
}
async function countMeal(meal) {

    res = new Map();
    mulMain = meal.eatenUnits/meal.totalUnits;
    for (i = 0; i < meal.ingredients.length; i++) {
        mul = meal.ingredients[i].units;
        for(j = 0; j < meal.ingredients[i].nutrientsPUnit.length; j++) {
            name = meal.ingredients[i].nutrientsPUnit[j].nutrient.name;
            unitName = meal.ingredients[i].nutrientsPUnit[j].nutrient.unitName;
            amount = meal.ingredients[i].nutrientsPUnit[j].amount;
            if (res.get(name) === undefined) res.set(name, 0);
            if (unitName == unitsMap.get(name))
                res.set(name, res.get(name) + amount*mul*mulMain)
        }
        
    }
    return res;
}
async function countMeals(meals) {
    const res = new Map();
    
    for (let k = 0; k < meals.length; k++) {
        const meal = meals[k];
        const mulMain = meal.eatenUnits / meal.totalUnits;
        for (let i = 0; i < meal.ingredients.length; i++) {
            const mul = meal.ingredients[i].units;
            for (let j = 0; j < meal.ingredients[i].nutrientsPUnit.length; j++) {
                const nutrient = meal.ingredients[i].nutrientsPUnit[j];
                const name = nutrient.nutrient.name;
                const amount = nutrient.amount;
                const unitName = nutrient.nutrient.unitName;
                const key = `${name}|${unitName}`;
                if (!res.has(key)) {
                    res.set(key, amount * mul * mulMain);
                } else {
                    res.set(key, res.get(key) + amount * mul * mulMain);
                }
            }
        }
    }
    return res;
}
async function getTodayMeals() {
    now = new Date()
    offset = now.getTimezoneOffset() * 60000
    localTime = new Date(now.getTime() - offset)
    localDate = localTime.toISOString().slice(0, 11)
    localStart = localDate + "00:00";
    localEnd = localDate + "23:59";

     try {
        const response = await fetch("meals/search?" + new URLSearchParams({
                "start":localStart, 
                "end":localEnd
            }).toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify()
        })

        if (response.status == 200) {
            res = await response.json()
            return res
        }
        
        
    } catch (error) {
        console.error("Error fetching data:", error)
    }
}
function addPhoto() {
    path = document.getElementById("filePicker").value;
    if (path.substr(0, 12) == "C:\\fakepath\\")
        path = path.substr(12);
    document.getElementById("fileLabel").innerHTML = path;
}

const url = new URL(window.location.href);
idToEdit = url.searchParams.get("mealId");
editMode = false;

async function addIngredient(ingredient) {
    ingredients.set(ingredientsSequence, {"name":ingredient.name, "units":ingredient.units, "nutrientsPUnit": ingredient.nutrientsPUnit});

    amount = ingredient.nutrientsPUnit[0].amount*ingredient.units;
    bestNutrientName = ingredient.nutrientsPUnit[0].nutrient.name;
    unitBest = ingredient.nutrientsPUnit[0].nutrient.unitName;
    for (i = 0; i < ingredient.nutrientsPUnit.length; i++) {
        if (ingredient.nutrientsPUnit[i].nutrient.name == getFirstGoal().name && (ingredient.nutrientsPUnit[i].nutrient.unitName == getFirstGoal().unitName)) {
            bestNutrientName = getFirstGoal().name;
            amount = ingredient.nutrientsPUnit[i].amount*ingredient.units;
            unitBest = ingredient.nutrientsPUnit[i].nutrient.unitName;
            break;
        }
    }
    name = ingredient.name
    if (name == "") name = "No name"
    document.getElementById("plate").innerHTML += `
        <div id = "i_`+ ingredientsSequence +`" class="flexer column clickablePlateColor" style = "padding: 20px; margin-top: 10px">
            <div class="flexer row space-between">
                <div class = "flexer text grayT" style = "align-items: center;">
                    ` + name + `
                </div>
                <div onclick ="editIngredient(`+ ingredientsSequence +`)" class="text backgroundT fontMid" style="margin-left: 40px;">E</div>
                <div onclick ="deleteIngredient(`+ ingredientsSequence +`)" class="text backgroundT fontMid" style="margin-left: 40px;">X</div>
            </div>
            <div class="flexer row space-between" style = "margin-top: 20px">
                <div class = "flexer text grayT" style = "align-items: center;">
                    ` + bestNutrientName + `
                </div>
                <div class="text grayT fontMid" style="margin-left: 40px;">` + amount + " " + await unitsMap.get(bestNutrientName) + `</div>
            </div>
        </div>
    `
    ingredientsSequence++;
}


fetchUserInfo()

oldImage = "";
async function start() {
    if (idToEdit != null) {
        await fetchDailyGoals()
        editMode = true;
        document.getElementById("todayTopNutrient").innerHTML = "Editing meal";

        const response = await fetch("/meals/" + idToEdit)
        if (response.status != 200) {
            alert("Error occured");
            redirectToJournal();
        }
        meal = await response.json();
        document.getElementById("mealTime").value = meal.time;
        document.getElementById("mealDescription").value = meal.description;
        document.getElementById("fileLabel").innerHTML = "Click to reupload"
        document.getElementById("totalUnits").value = meal.totalUnits*100;
        document.getElementById("eatenUnits").value = meal.eatenUnits*100;
        oldImage = meal.images[0];

        for(var i = 0; i < meal.ingredients.length; i++) {
            await addIngredient(meal.ingredients[i])
        }
        if (meal.starred) {
            changeStarring();
        }

    } else {
        await setCurrentTimeAsMealTime()
        fetchDailyGoals().then(() => {
            getTodayMeals().then(res => {
                
                countMeals(res).then(res2 => {
                    
                    if (dailyGoals.length == 0) {
                        document.getElementById("todayTopNutrient").innerHTML = "No goals set"
                        return;
                    }
                    eaten = res2.get(dailyGoals[0].nutrient.name+"|"+dailyGoals[0].nutrient.unitName);
                    if (eaten === undefined) eaten = 0;
                    document.getElementById("todayTopNutrient").innerHTML = dailyGoals[0].nutrient.name + " " + eaten + "/" + dailyGoals[0].amount + " " + unitsMap.get(dailyGoals[0].nutrient.name);
                });
            })
        })
    }
}



async function getDefaultNutrients() {
    const response = await fetch("defaultnutrients")

    if (response.status = 200) {
        defaultNutrients = await response.json()
        buildUnitsMap()
        return defaultNutrients
    }
    else return []
}
let defaultNutrientsPromise = getDefaultNutrients(); 
defaultUnitsMap = new Map();
function buildUnitsMap() {
    defaultUnitsMap.clear();
    for (i = 0; i < defaultNutrients.length; i++) {
        units = defaultUnitsMap.get(defaultNutrients[i].name);
        if (units === undefined)
            defaultUnitsMap.set(defaultNutrients[i].name, [defaultNutrients[i].unitName])
        else {
            unitsNow = defaultUnitsMap.get(defaultNutrients[i].name);
            unitsNow[unitsNow.length] = defaultNutrients[i].unitName;
            defaultUnitsMap.set(defaultNutrients[i].name, unitsNow)
        }
    }
}


start()

