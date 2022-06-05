// A fun macro to speed things up rolling character attributes. 
// Offers a few settings to provide degrees of difficulty
// The fewer selections you make, the lower the difficulty score, and the less likely fate will shine a positive light on your character's rolls.
// 
// by: MrFoxar

ChatMessage.create({
                  user: game.user._id,
                  content: "Preparing to roll my attributes...",
                  speaker: speaker
                }, {});

let namedfields = (...fields) => {
  return (...arr) => {
    var obj = {};
    fields.forEach((field, index) => {
      obj[field] = arr[index];
    });
    return obj;
  };
};

let num_dice = namedfields('formula', 'die', 'difficulty')
var num_die = [
  num_dice('3d6 - Keep All', 3, 0),
  num_dice('4d6 - Drop Lowest', 4, 2)
];

let num_roll = namedfields('method', 'rolls', 'difficulty')
var num_rolls = [
  num_roll('6 Rolls - Keep All', 6, 0),
  num_roll('7 Rolls - Drop Lowest', 7, 1)
];

let bonus = namedfields('method', 'difficulty')
var bonus_points = [
  bonus('0 Bonus Points', 0),
  bonus('1 Bonus Point', 1),
  bonus('1d4 Bonus Points', 3)
];

let attribute = namedfields('attribute')
var attributes = [
  attribute('STR: '),
  attribute('DEX: '),
  attribute('CON: '),
  attribute('INT: '),
  attribute('WIS: '),
  attribute('CHA: ')
];
				
let applyChanges = false;
new Dialog({
  title: `Roll New Player Attributes`,
  content: `
<form>
<p>The more selections you make, the more likely fate will shine a positive light on your character's attributes - and the less challenging gameplay may be... results may vary.</p>
  <div class="form-group">
    <label>Number of Dice:</label>
    <select id="num-dice" name="num-dice">	  
      ${
        num_die.map((num_dice, index) => {
          return `\t<option value=${index}>${num_dice.formula}</option>`;
        }).join('\n')
      }
    </select>
  </div>
  <div class="form-group">
    <label>Re-roll 1's:</label>	  
	<input id="re_roll_ones" type="checkbox"></input>
  </div>
  <div class="form-group">
    <label>Number of Rolls:</label>
    <select id="num-rolls" name="num-rolls">	  
      ${
        num_rolls.map((num_roll, index) => {
          return `\t<option value=${index}>${num_roll.method}</option>`;
        }).join('\n')
      }
    </select>
  </div>
  <div class="form-group">
    <label>Bonus Points:</label>	  
    <select id="bonus-points" name="bonus-points">	  
      ${
        bonus_points.map((bonus, index) => {
          return `\t<option value=${index}>${bonus.method}</option>`;
        }).join('\n')
      }
    </select>
  </div>
  <div class="form-group">
    <label>Attributes Over 18 Allowed at 1st Level:</label>	  
	<input id="over-eighteen" type="checkbox"></input>
  </div>
  <div class="form-group">
    <label>Distribute Results Freely Among Attributes:</label>	  
	<input id="distribute-results" type="checkbox"></input>
  </div>
</form>
`,
  buttons: {
    yes: {
      icon: "<i class='fas fa-check'></i>",
      label: `Roll Attributes`,
      callback: () => applyChanges = true
    },
    no: {
      icon: "<i class='fas fa-times'></i>",
      label: `Cancel`,
      callback: () => applyChanges = false
    },
  },
  default: "yes",
  close: html => {
    if (applyChanges) {
		
		var roll_count = 0;
		var att_results = [];
		var roll = 0;
		var current_result = 0;
		var die_roll_results = "";
		var die_rolls = [];
		
		let num_diceIndex = parseInt(html.find('[name="num-dice"]')[0].value);
		let die = num_die[num_diceIndex].die;
		let die_difficulty = num_die[num_diceIndex].difficulty;	
		
		let num_rollIndex = parseInt(html.find('[name="num-rolls"]')[0].value);
		let rolls = num_rolls[num_rollIndex].rolls;
		let rolls_difficulty = num_rolls[num_rollIndex].difficulty;
		
		let bonus_Index = parseInt(html.find('[name="bonus-points"]')[0].value);
		let bonus_method = bonus_points[bonus_Index].method;
		let bonus_method_difficulty = bonus_points[bonus_Index].difficulty;
		
		let re_roll_ones = html[0].querySelector("#re_roll_ones").checked;
		let over_eighteen = html[0].querySelector("#over-eighteen").checked;
		let distribute_results = html[0].querySelector("#distribute-results").checked;
		
		// Roll them dice!
		while(roll_count < rolls)
		{
			var current_rolls = [];
			die_roll_results = " [";
			for (i = 0; i < die; i++){
				do{
					roll = new Roll("1d6").evaluate({async: false}).total// I want to see the results from each d6, so I am not using any shorthand like 4d6r1dl					 
					if(roll > 1 || !re_roll_ones){
						//console.log("roll(" + i + ")" + roll);
						current_rolls.push(roll);
						die_roll_results += roll + (i < die-1 ? ", " : "");
					}					
				}while(roll === 1 && re_roll_ones)
			}
			
			die_roll_results += "]";
			die_rolls.push(die_roll_results);
			
			current_result = current_rolls.reduce((a,b) => a + b) - (die === 4 ? Math.min(...current_rolls) : 0);
			//console.log("current_result(" + roll_count + ")" + current_result);
			att_results.push(current_result);
			roll_count += 1;
		}

		// Drop lowest
		var dropped_val = Math.min(...att_results);
		var dropped_val_idx = att_results.indexOf(dropped_val);
		if(rolls === 7){
			delete att_results[dropped_val_idx ];
		}
		
		// Bonus Points
		var bonus_roll;
		switch(bonus_method) {
			case "0 Bonus Points":  
				bonus_roll = 0
				break;

			case "1 Bonus Point":  
				bonus_roll = 1
				break;

			case "1d4 Bonus Points":
				bonus_roll = new Roll("1d4").evaluate({async: false}).total
				break;

			default:
		}		
		
		// Get difficulty level		
		var difficulty = die_difficulty + rolls_difficulty + bonus_method_difficulty;
		difficulty += re_roll_ones ? 3 : 0;
		difficulty += over_eighteen ? 2 : 0;
		difficulty += distribute_results ? 3 : 0;
		
		var difficulty_desc = "";
		switch(difficulty){
			case 0:
				difficulty_desc = "HardCore";
				break;
			case 1:
			case 2:
			case 3:
				difficulty_desc = "Veteran";
				break;
			case 5:
			case 4:
			case 6:
			case 7:
			case 8:
				difficulty_desc = "Easy Button";
				break;
			case 9:
			case 10:
			case 11:
			case 12:
			case 13:
			case 14:
			case 15:
				difficulty_desc = "Why do you play?";
				break;
		}

		// Build message for Method & Results
		var results_message = "<b>Method:</b></br>";
		results_message += num_die[num_diceIndex].formula + (re_roll_ones ? "; but re-roll ones" : "") + "</br>";
		results_message += num_rolls[num_rollIndex].method + "</br>";
		results_message += bonus_Index > 0 ? "+" + bonus_method + "</br>" : "";
		results_message += over_eighteen ? "Over 18 Allowed</br>" : "No scores over 18 at 1st level</br>";
		results_message += distribute_results ? "Distribute freely</br></br>" : "Apply as rolled</br></br>";
		results_message += "<b>Dificulty:</b> " + difficulty_desc + "</br></br>";
		results_message += "<b>Results:</b></br>";
		var apply_to = "";
		var att_idx = -1;
		for(f = 0;f < att_results.length; f++)
		{	
			if(att_results[f] != undefined){att_idx++;}
			apply_to = !distribute_results && att_results[f] != undefined ? attributes[att_idx].attribute : "Result #" + (f+1) + ": ";
			results_message += apply_to + (att_results[f] != undefined ? att_results[f] : "Dropped " + dropped_val) + die_rolls[f];
			if(att_results[f] != undefined && att_results[f] === 18){results_message += " - Booyah!";}
			results_message += "<br />";
		}
		results_message += (bonus_Index > 0 ? "</br><b>Bonus:</b> " + bonus_roll + "</br></br>" : "</br>");
		
		// Note from DM
		results_message += "<b>Note from DM:</b></br>";
		results_message += distribute_results ? "You may distribute these scores among your attributes as you desire. " : "Each result must be applied to attributes in the order they were rolled. ";
		if(bonus_Index > 0){results_message += "The Bonus point(s) may be distributed among any of your scores. ";}		
		results_message += "Final scores may " +( over_eighteen ? "" : "<b>not</b>") +" be above 18 after including ";
		if(bonus_Index > 0){results_message += "Bonus and ";}
		results_message += "any bonuses at 1st level. ";
			  
		ChatMessage.create({
			user: game.user._id,
			content: results_message,
			speaker: speaker
			}, {});
	}
  }
}).render(true);
