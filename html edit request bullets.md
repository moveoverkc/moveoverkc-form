* a checkbox above the submit button that confirms something like "they have read everything in this form and have filled this form out as complete as they can. Failure to include all heavy items and obstacles including but not limited to stairs, heavy furniture, heavy appliances, etc will result in an additional fee.", and they can't submit the form without selecting it. It might be good to have an additional pop up say "Checking this box confirms that I have read the form entirely and provided as much detail as possible"


* Under Loading/Unloading details, make the Moving Truck section hidden. Next bullet explains the toggle


* Under Loading/Unloading details, have the options  ( ⬜only loading ⬜only unloading ⬜both loading and unloading ) at the top and require one be selected before submitting.  If they select only Loading, remove requirement for "Ending Address" (under move details) and HIDE "Ending Location" (under Moving Details). If they select only Unloading, remove requirement for "Starting Address" (under move details) and HIDE "Starting Location" (under Moving Details). If they select both loading and unloading, show and require "Moving Truck" hidden by the previous bullet. 


* Under "Services Needed" section, add a checkbox option for Other Service Not Listed. When selected, brings up a text box so they can describe what they need done with as much detail as possible. 250 characters required


* Under "Packing Details", add the code below but format like the "Heavy and Specialty Items" check boxes.
the old code for these check boxes:

            <h3>Packing Supplies</h3>

<div class="checkbox-group">
<label><input type="checkbox" onchange="toggleSection('SmallBox', this)"> Small Moving Box <input id="SmallBox" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('MediumBox', this)"> Medium Moving Box <input id="MediumBox" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('LargeBox', this)"> Large Moving Box <input id="LargeBox" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('XLBox', this)"> Extra Large Moving Box <input id="XLBox" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('TVBox', this)"> TV Moving Box <input id="TVBox" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('OtherBox', this)"> Other Moving Box <input id="OtherBox" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('Tape', this)"> Rolls of Tape <input id="Tape" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('PlasticWrap', this)"> Rolls of Plastic Wrap <input id="PlasticWrap" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('PackingPaper', this)"> Rolls of Packing Paper <input id="PackingPaper" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('BubbleWrap', this)"> Rolls of Bubble Wrap <input id="BubbleWrap" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('FragileStickers', this)"> Fragile Stickers <input id="FragileStickers" input type="number" class="hidden" placeholder="Quantity"></label>
<label><input type="checkbox" onchange="toggleSection('MattressBags2', this)"> Mattress Bags</label>
<div class="hidden" id="MattressBags2">
	<p style="margin-left: 20px;">
    <label><input type="checkbox" onchange="toggleSection('twinNumber3', this)"> Twin <input type="number" class="hidden" placeholder="Quantity" id="twinNumber3"></label>
    <label><input type="checkbox" onchange="toggleSection('fullNumber3', this)"> Full <input type="number" class="hidden" placeholder="Quantity" id="fullNumber3"></label>
    <label><input type="checkbox" onchange="toggleSection('queenNumber3', this)"> Queen <input type="number" class="hidden" placeholder="Quantity" id="queenNumber3"></label>
    <label><input type="checkbox" onchange="toggleSection('kingNumber3', this)"> King <input type="number" class="hidden" placeholder="Quantity" id="kingNumber3"></label>
    <label><input type="checkbox" onchange="toggleSection('calikingNumber3', this)"> California King <input type="number" class="hidden" placeholder="Quantity" id="calikingNumber3"></label>
    <label><input type="checkbox" onchange="toggleSection('OtherMatt3', this)"> Other Mattress (specify size and quantity under "Other Supplies") <input type="text" class="hidden" placeholder="Describe" id="OtherMatt3"></label>
</p>
</div>
</div>


* In the above code/list (Packing Supplies), add "Other Supplies" text box, not hidden, where the client can add notes about supplies or add any other needed supplies that aren't listed