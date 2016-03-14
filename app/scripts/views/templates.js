'use strict';
angular.module('admanager.templates', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('../app/scripts/views/bookingForm.tpl.html',
        '<div id="bookingForm" class="modal" tabindex="-1" role="dialog" ng-controller="bookingForm">\n' +
        '    <div class="modal-dialog modal-lg">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="modal-header" ng-show="title">\n' +
        '                <button type="button" class="close" ng-click="$hide()">&times;</button>\n' +
        '                <h4 class="modal-title" ng-bind-html="title"></h4>\n' +
        '            </div>\n' +
        '            <div class="modal-body" ng-show="content">\n' +
        '                <div class="row top-buffer">\n' +
        '                    <div class="col-md-12">\n' +
        '                        <form id="bForm" class="form-horizontal" role="form" name="bForm" novalidate>\n' +
        '                            <div class="panel panel-default">\n' +
        '                                <div class="panel-heading">委刊單</div>\n' +
        '                                <div class="panel-body" class="panel panel-default position-fixed">\n' +
        '                                    <div class="form-group">\n' +
        '                                        <label class="control-label col-sm-2" for="orderName">委刊單名稱</label>\n' +
        '                                        <div class="col-sm-10">\n' +
        '                                            <input type="text" class="form-control" id="orderName" name="orderName" ng-model="bookingForm.orderName" required>\n' +
        '                                            <div ng-show="bForm.$submitted || bForm.orderName.$touched">\n' +
        '                                              <div class="error" ng-show="bForm.orderName.$error.required">填寫委刊單</div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                    <div class="form-group">\n' +
        '                                        <label class="control-label col-sm-2">背景顏色:</label>\n' +
        '                                        <div class="col-sm-10">\n' +
        '                                            <div class="input-group col-sm-12">\n' +
        '                                                <label class="input-group-addon" ng-style="{\'background-color\': bookingForm.orderColor}">&nbsp;&nbsp;&nbsp;&nbsp;</label>\n' +
        '                                                <input type="text" class="form-control" name="orderColor"  colorpicker colorpicker-parent="true" ng-model="bookingForm.orderColor" required>\n' +
        '                                            </div>\n' +
        '                                            <div class="col-sm-12" ng-show="bForm.$submitted || bForm.orderColor.$touched">\n' +
        '                                                <div class="error" ng-show="bForm.orderColor.$error.required">選取背景色</div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                            <div class="lineItems">\n' +
        '                                <div class="panel panel-default" ng-repeat="lineItem in bookingForm.lineItems track by $index">\n' +
        '                                    <div class="panel-heading">委刊項目</div>\n' +
        '                                    <div class="panel-body" class="panel panel-default position-fixed">\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemName\' + $index }}">委刊項名稱</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <input type="text" class="form-control" name="{{ \'lineItemName\' + $index }}" ng-model="lineItem.name" required>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemName\'+$index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemName\'+$index].$error.required">填寫委刊項名稱</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemAdUnits\' + $index }}">廣告單元</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <select name="{{ \'lineItemAdUnits\' + $index }}" class="form-control"  ng-model="lineItem.adUnits" required>\n' +
        '                                                    <option ng-repeat="option in ganttData track by option.id " value="{{option.id}}" ng-selected="option.id === lineItem.adUnits">{{option.name}}</option>\n' +
        '                                                </select>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemAdUnits\'+ $index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemAdUnits\'+ $index].$error.required">填寫廣告單元</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemFromDate\' + $index }}">開始時間</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <input type="text" class="form-control" name="{{ \'lineItemFromDate\' + $index }}" ng-model="lineItem.fromDate" min-date="today" max-date="{{ lineItem.toDate }}" start-date="{{ lineItem.currentDateValue.toString() }}" start-week="1" placeholder="From" bs-datepicker required>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemFromDate\'+$index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemFromDate\'+$index].$error.required">填寫開始時間</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemToDate\' + $index }}">結束時間</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <input type="text" class="form-control" name="{{ \'lineItemToDate\' + $index }}" ng-model="lineItem.toDate" min-date="{{ lineItem.fromDate }}" start-date="{{ lineItem.currentDateValue.toString() }}" start-week="1" placeholder="To" bs-datepicker required>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemToDate\'+$index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemToDate\'+$index].$error.required">填寫結束時間</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <div class="col-sm-10"></div>\n' +
        '                                            <div class="btn-group col-sm-2">\n' +
        '                                                <button type="button" style="float: right" class="btn btn-default" ng-click="handleReduceLineItem($index)">移除委刊項</button>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                                <div class="btn-group">\n' +
        '                                    <button class="btn btn-default" type="button" ng-click="handleAddLineItem()">新增委刊項</button>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '\n' +
        '                        </form>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '                <div class="modal-footer">\n' +
        '                <div class="form-actions">\n' +
        '                    <button id="handle-delete-booking" ng-if="bookingForm.isEdit" class="btn btn-danger" ng-click="handlePopoverConfirm(\'handleDeleteBooking\', $event)"><i class="glyphicon glyphicon-trash"></i>Delete</button>\n' +
        '                    <button class="btn btn-primary" type="submit" ng-click="handleSaveBooking()">儲存 Booking</button>\n' +
        '                    <button id="handle-sycing-dfp" ng-if="bookingForm.isEdit" class="btn btn-success" type="submit" ng-click="handlePopoverConfirm(\'handleSyncingToDFP\', $event)">同步到DFP</button>\n' +
        '                </div>\n' +
        '\n' +
        '\n' +
        '                    <!-- <button type="button" class="btn btn-default" ng-click="$hide()">Close</button> -->\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
    $templateCache.put('../app/scripts/views/changeColorForm.tpl.html',
        '<div class="aside" tabindex="-1" role="dialog">\n' +
        '    <div class="aside-dialog">\n' +
        '        <div class="aside-content">\n' +
        '            <div class="aside-header" ng-show="title">\n' +
        '                <button type="button" class="close" ng-click="$hide()">&times;</button>\n' +
        '                <h4 class="aside-title" ng-bind-html="title"></h4>\n' +
        '            </div>\n' +
        '            <div class="aside-body" ng-show="changeColorModel">\n' +
        '                <form id="change-color-form" class="form-horizontal task-model" role="form">\n' +
        '                    <div class="row">\n' +
        '                        <div class="col-sm-12">\n' +
        '                            <div class="form-group">\n' +
        '                                <label class="control-label col-sm-3">委刊單:</label>\n' +
        '                                <div class="col-sm-8">\n' +
        '                                    <input type="text" class="form-control" value="{{ changeColorModel.orderName }}" disabled="disabled" />\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                            <div class="form-group">\n' +
        '                                <label class="control-label col-sm-3">背景顏色:</label>\n' +
        '                                <div class="col-sm-8">\n' +
        '                                    <div class="input-group ">\n' +
        '                                        <span class="input-group-addon" ng-style="{\'background-color\':changeColorModel.color}">&nbsp;&nbsp;&nbsp;&nbsp;</span>\n' +
        '                                        <input type="text" class="form-control" colorpicker colorpicker-parent="true" ng-model="changeColorModel.color">\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </form>\n' +
        '            </div>\n' +
        '            <div class="aside-footer">\n' +
        '                <div class="col-sm-11">\n' +
        '                    <button type="button" ng-click="taskSaveColor()" class="btn btn-primary">儲存顏色</button>\n' +
        '                    <button type="button" class="btn btn-default" ng-click="$hide()">取消編輯</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
    $templateCache.put('../app/scripts/views/confirmForm.tpl.html',
        '<div class="popover" tabindex="-1" ng-show="content">\n' +
        '  <div class="arrow"></div>\n' +
        '  <h3 class="popover-title" ng-bind-html="title" ng-show="title"></h3>\n' +
        '  <div class="popover-content">\n' +
        '    <form name="popoverForm">\n' +
        '      <p ng-bind-html="content" style="min-width:300px;"></p>\n' +
        '      <div class="form-actions">\n' +
        '        <button type="button" class="btn btn-danger" ng-click="$hide()">關閉</button>\n' +
        '        <button type="button" class="btn btn-primary" ng-click="saved($event)">儲存</button>\n' +
        '      </div>\n' +
        '    </form>\n' +
        '  </div>\n' +
        '</div>\n' +
        '');
    $templateCache.put('../app/scripts/views/oneGantt.tpl.html',
        '<div id="one-gantt" class="modal" tabindex="-1" role="dialog" ng-controller="OneGantt">\n' +
        '    <div class="modal-dialog">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="is-loading-wrap" ng-if="options.isLoading">\n' +
        '                <div class="is-loading-box container-fluid">\n' +
        '                    <div class="row top-buffer">\n' +
        '                        <div class="col-md-12 modal-content">\n' +
        '                            <h4><i class="fa fa-cog fa-spin"></i>   讀取資料中</h4>\n' +
        '                            <div class="progress"><div class="progress-bar progress-bar-info progress-bar-striped active" role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width: 100%"><span class="sr-only">Loading!</span></div></div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '            <div class="modal-header" ng-show="title">\n' +
        '                <button type="button" class="close" ng-click="$hide()">&times;</button>\n' +
        '                <h4 class="modal-title" ng-bind-html="title"></h4>\n' +
        '            </div>\n' +
        '            <div class="modal-body" ng-show="content">\n' +
        '                <div class="container-fluid">\n' +
        '                    <div class="row">\n' +
        '                        <div class="col-md-12">\n' +
        '                            <div class="form-inline">\n' +
        '                                <div class="form-group text-center">\n' +
        '                                    <label class="control-label"><i class="fa fa-calendar"></i> <i class="fa fa-arrows-h"></i> <i class="fa fa-calendar"></i>   時間區間</label><br>\n' +
        '                                    <div class="form-group">\n' +
        '                                        <input type="text" class="form-control" ng-model="options.fromDate" max-date="{{ ng(\'options.toDate\')}}" start-date="{{ ng(\'options.currentDateValue.toString()\')}}" start-week="1" placeholder="From" bs-datepicker>\n' +
        '                                    </div>\n' +
        '                                    <div class="form-group">\n' +
        '                                        <input type="text" class="form-control" ng-model="options.toDate" min-date="{{ ng(\'options.fromDate\')}}" start-date="{{ ng(\'options.currentDateValue.toString()\')}}" start-week="1" placeholder="To" bs-datepicker>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                                <div class="form-group">\n' +
        '                                    <label class="control-label"><i class="fa fa-database"></i>  時間操作</label><br>\n' +
        '                                    <div class="btn-group">\n' +
        '                                        <button class="btn btn-default" ng-click="resetDate()">重設時間</button>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '\n' +
        '                <div class="row top-buffer">\n' +
        '                    <div class="col-md-12">\n' +
        '                        <div class="panel-group" bs-collapse>\n' +
        '                            <div class="panel panel-default">\n' +
        '                                <div class="panel-collapse" bs-collapse-target>\n' +
        '                                    <div class="panel-body" class="panel panel-default position-fixed" data-target="menu-{{ ng(\'$index\') }}">\n' +
        '                                        <div gantt\n' +
        '                                             data="data"\n' +
        '                                             timespans="timespans"\n' +
        '                                             show-side="options.labelsEnabled"\n' +
        '                                             daily="options.daily"\n' +
        '                                             filter-task="{\'name\': options.filterTask}"\n' +
        '                                             filter-row="options.filterRow"\n' +
        '                                             sort-mode="options.sortMode"\n' +
        '                                             view-scale="options.scale"\n' +
        '                                             column-width="getColumnWidth(options.width, options.scale, options.zoom)"\n' +
        '                                             auto-expand="options.autoExpand"\n' +
        '                                             task-out-of-range="options.taskOutOfRange"\n' +
        '                                             from-date = "options.fromDate"\n' +
        '                                             to-date = "options.toDate"\n' +
        '                                             allow-side-resizing = "options.allowSideResizing"\n' +
        '                                             task-content = "options.taskContentEnabled ? options.taskContent : undefined"\n' +
        '                                             row-content = "options.rowContentEnabled ? options.rowContent : undefined"\n' +
        '                                             current-date="options.currentDate"\n' +
        '                                             current-date-value="options.currentDateValue"\n' +
        '                                             headers="options.width && options.shortHeaders || options.longHeaders"\n' +
        '                                             headers-formats="options.headersFormats"\n' +
        '                                             max-height="options.maxHeight && 300 || 0"\n' +
        '                                             time-frames="options.timeFrames"\n' +
        '                                             date-frames="options.dateFrames"\n' +
        '                                             time-frames-non-working-mode="options.timeFramesNonWorkingMode"\n' +
        '                                             time-frames-magnet="options.timeFramesMagnet"\n' +
        '                                             api="options.api"\n' +
        '                                             column-magnet="options.columnMagnet"\n' +
        '                                             >\n' +
        '                                            <gantt-tree enabled="options.sideMode === \'Tree\' || options.sideMode === \'TreeTable\'"\n' +
        '                                                        header-content="options.treeHeaderContent"\n' +
        '                                                        keep-ancestor-on-filter-row="true">\n' +
        '                                            </gantt-tree>\n' +
        '                                            <gantt-table enabled="options.sideMode === \'Table\' || options.sideMode === \'TreeTable\'"\n' +
        '                                                         columns="options.sideMode === \'TreeTable\' ? options.treeTableColumns : options.columns"\n' +
        '                                                         headers="options.columnsHeaders"\n' +
        '                                                         classes="options.columnsClasses"\n' +
        '                                                         formatters="options.columnsFormatters"\n' +
        '                                                         contents="options.columnsContents"\n' +
        '                                                         header-contents="options.columnsHeaderContents">\n' +
        '                                            </gantt-table>\n' +
        '                                            <gantt-tooltips content="options.tooltipsContent"></gantt-tooltips>\n' +
        '                                            <gantt-tooltips delay="100" content="options.tooltipsContent"></gantt-tooltips>\n' +
        '                                            <gantt-resize-sensor></gantt-resize-sensor>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '                <div class="modal-footer">\n' +
        '                    <button type="button" class="btn btn-default" ng-click="$hide()">Close</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
}]);
