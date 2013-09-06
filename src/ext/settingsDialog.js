/*jslint browser:true, devel:true, white:true, es5:true */
/*globals $ */

window.GokoSalvager.createSettingsDialog = function () {
    "use strict";

    return $('\
<div id="usDialog" title="User Settings" \
  ng:app ng:controller="gokoSalvagerUserSettingsController" >\
  Autokick:<br>\
  &nbsp&nbsp<input type="checkbox" ng:model="us.autokick_by_rating" ng:click="save(us)" />using rating range in game title<br />\
  &nbsp&nbsp<input type="checkbox" ng:model="us.autokick_by_forname" ng:click="save(us)" />using "For X" in game title<br />\
  Alerts:<br>\
  &nbsp&nbsp<input type="checkbox" ng:model="us.alert_sounds" ng:click="save(us)" />Use sounds<br />\
  &nbsp&nbsp<input type="checkbox" ng:model="us.alert_popups" ng:click="save(us)" />Use popups (not recommended)<br />\
  <input type="checkbox" ng:model="us.generator" ng:click="save(us)" />Kingdom Generator<br />\
  <input type="checkbox" ng:model="us.proranks" ng:click="save(us)" />Display pro ratings<br />\
  <input type="checkbox" ng:model="us.sort_rating" ng:click="save(us)" />Sort by rating<br />\
  <input type="checkbox" ng:model="us.logviewer" ng:click="save(us)" />Show Prettified log and VP counter<br />\
  <input type="checkbox" ng:model="us.vp_request" ng:click="save(us)" />Always request VP counter (#vpon)<br />\
  <input type="checkbox" ng:model="us.vp_disallow" ng:click="save(us)" />Always refuse VP counter (#vpoff)<br />\
  <input type="checkbox" ng:model="us.always_stack" ng:click="save(us)"/>\
    Stack duplicate cards<br />\
  Blacklist (noplay + censor):\
  <table>\
    <tr ng:repeat="pname in us.blacklist">\
      <td><label style="color:red" ng:click="rem_from_blacklist(pname)">X</label> </td>\
      <td>{{pname}}</td>\
      <td></td>\
      <td></td>\
    </tr>\
    <tr>\
      <td></td>\
      <td><input type="text" ng:model="temp_bl" /></td>\
      <td><button ng:click="add_to_blacklist(temp_bl)" >Add</button></td>\
      <td><button onclick="$(\'#usDialog\').dialog(\'close\');">Close</td>\
    <tr>\
  </table>\
</div>');
};
