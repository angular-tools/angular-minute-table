(function () {
    'use strict';

    angular.module('angularMinuteTable', ['angularTimeAgo', 'angularStringFilters'])
        .directive('angularMinuteTable', ['$timeout', '$compile', function ($timeout, $compile) {
            return {
                restrict: 'A',
                replace: true,
                compile: function (element, attrs) {
                    var ucfirst = function (str) { return angular.isString(str) ? str.charAt(0).toUpperCase() + str.substr(1) : str; };
                    var fix = function (str) { return ucfirst((str || '').replace(/\_/g, ' '));};
                    var repeater = element.find('[ng-repeat]').attr('ng-repeat').split(/\s*in\s*/);
                    var matches, toggleCheck;

                    element.prepend('<thead><tr></tr></thead>');

                    element.find('tr[ng-link]').each(function () {
                        var tr = angular.element(this);
                        var trLink = tr.attr('ng-link');

                        if (trLink) {
                            var trTarget = tr.attr('ng-target');

                            tr.find('td:not(:has(a))').each(function () {
                                angular.element(this).wrapInner('<a href="" ng-href="' + trLink + '"' + (trTarget ? 'target="' + trTarget + '"' : '') + '></a>');
                            });
                        }
                    });

                    element.find('td').each(function () {
                        var ele = angular.element(this);
                        var field = ele.attr('ng-field');
                        var name = ele.attr('ng-title') || fix(field);
                        var css = ele.attr('ng-class') || '';
                        var checkbox = ele.children().length == 1 ? ele.find('input[type="checkbox"]') : null;
                        var th;

                        if (checkbox.length > 0) { //toggleAll && isAllSelected must be implemented in the local $scope [http://goo.gl/SMKu9G]
                            th = ('<th><input type="checkbox" ng-show="!!toggleAll" ng-click="toggleAll()" ng-model="isAllSelected"></th>');
                        } else {
                            th = ('<th ' + (field ? 'style="cursor: pointer"' : '' ) + ' ' + (css ? 'class="' + css + '"' : '') + 'ng-click="_table.sort(\'' + field + '\')">' + name +
                            '<i class="fa fa-fw {{_table.orderBy == \'' + field + '\' && (_table.reversed[\'' + field + '\'] && \'fa-sort-desc\' || \'fa-sort-asc\') || \'\'}}"></i></th>');
                        }

                        element.find('thead > tr').append(th);
                    });

                    return {
                        pre: function ($scope, element, attrs) {
                            var model = repeater[1];
                            var items = $scope[model];
                            var refresh, order = {};

                            if (items && (matches = /^(\w+)\s*(ASC|DESC)?/i.exec(items.getOrderBy()))) {
                                order = {field: matches[1], reversed: /desc/i.test(matches[2])};
                            }

                            $scope._table = {reversed: {}, orderBy: order.field};
                            $scope._table.reversed[order.field] = order.reversed;

                            $scope._table.sort = function (field) {
                                if (field != 'undefined') {
                                    if ($scope._table.orderBy == field) {
                                        $scope._table.reversed[field] = !$scope._table.reversed[field];
                                    } else {
                                        $scope._table.orderBy = field;
                                    }

                                    var order = field + ($scope._table.reversed[field] ? ' DESC' : ' ASC');
                                    items.setOrderBy(order);
                                }
                            };

                            $scope.$on("item_removed", function (ev, target) {
                                if (target && target.parent === items) {
                                    if (target.parent && target.parent.length < target.parent.getItemsPerPage() && target.parent.length < target.parent.getTotalItems()) {
                                        $timeout.cancel(refresh);
                                        refresh = $timeout(target.parent.refresh, 250);
                                    }
                                }
                            });
                        }
                    }
                }
            };
        }]);
})();
