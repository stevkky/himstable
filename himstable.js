(function (Handsontable) {
    var HIMSTable = Handsontable.editors.HandsontableEditor.prototype.extend();
    
    HIMSTable.prototype.init = function () {
        Handsontable.editors.HandsontableEditor.prototype.init.apply(this, arguments);

        this.query = null;
        this.choices = [];
    };

    HIMSTable.prototype.createElements = function () {
        Handsontable.editors.HandsontableEditor.prototype.createElements.apply(this, arguments);

        Handsontable.Dom.addClass(this.htContainer, 'autocompleteEditor');
        Handsontable.Dom.addClass(this.htContainer, window.navigator.platform.indexOf('Mac') === -1 ? '' : 'htMacScroll');
    };

    var skipOne = false;
    var KEY_CODES = Handsontable.helper.KEY_CODES;
    var filterColumn = 0;
    function onBeforeKeyDown(event) {
        skipOne = false;
        var editor = this.getActiveEditor();
        ///console.log(KEY_CODES);
        if (Handsontable.helper.isPrintableChar(event.keyCode) || event.keyCode === KEY_CODES.BACKSPACE ||
          event.keyCode === KEY_CODES.DELETE || event.keyCode === KEY_CODES.INSERT) {
            var timeOffset = 0;

            // on ctl+c / cmd+c don't update suggestion list
            if (event.keyCode === KEY_CODES.C && (event.ctrlKey || event.metaKey)) {
                return;
            }
            if (!editor.isOpened()) {
                timeOffset += 10;
            }

            if (editor.htEditor) {
                editor.instance._registerTimeout(setTimeout(function () {
                    editor.queryChoices(editor.TEXTAREA.value);
                    skipOne = true;
                }, timeOffset));
            }
        }
    }

    HIMSTable.prototype.prepare = function (td, row, col, prop, value, cellProperties) {
        this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
        Handsontable.editors.HandsontableEditor.prototype.prepare.apply(this, arguments);
        var filterColumn = this.getFilterColumn();
        var parent = this;
        var options = {
            startRows: 0,
            startCols: 0,
            minRows: 0,
            minCols: 0,
            className: 'listbox',
            copyPaste: false,
            autoColumnSize: false,
            autoRowSize: false,
            readOnly: true,
            fillHandle: false,           
            afterOnCellMouseDown: function (event, coords, TD)
            {
                var value = this.getValue();              
                // if the value is undefined then it means we don't want to set the value
                if (value !== void 0)
                {
                    if (filterColumn == coords.col)
                    {                        
                        parent.setValue(value);

                        parent.instance.destroyEditor();// I will only destroy editor when the correct column is selected
                    }                
                    
                }
                
            }
        };

        if (this.cellProperties.handsontable) {
            Handsontable.helper.extend(options, cellProperties.handsontable);
        }
        this.htOptions = options;

    };


    function onafterOnCellMouseDown(event, coords, TD) {
        console.log("mouse clicked");
    }

    HIMSTable.prototype.open = function () {
       
        Handsontable.editors.HandsontableEditor.prototype.open.apply(this, arguments);
       
        var choicesListHot = this.htEditor.getInstance();
        var that = this;
        var trimDropdown = this.cellProperties.trimDropdown === void 0 ? true : this.cellProperties.trimDropdown;

        this.TEXTAREA.style.visibility = 'visible';
        this.focus();
        var filterColumn = this.getFilterColumn();

        choicesListHot.updateSettings({
            //colWidths: trimDropdown ? [Handsontable.Dom.outerWidth(this.TEXTAREA) - 2] : void 0,
            width: trimDropdown ? Handsontable.Dom.outerWidth(this.TEXTAREA) + Handsontable.Dom.getScrollbarWidth() + 2 : void 0,
            afterRenderer: function (TD, row, col, prop, value) {
                var caseSensitive = this.getCellMeta(row, col).filteringCaseSensitive === true,
                  indexOfMatch,
                  match,
                  value = Handsontable.helper.stringify(value);
               
               // console.log("that.query:" + that.query);
                if (value && that.query) {
                    indexOfMatch = caseSensitive ? value.indexOf(this.query) : value.toLowerCase().indexOf(that.query.toLowerCase());
                    
                    if (indexOfMatch != -1 && filterColumn == col) {

                        match = value.substr(indexOfMatch, that.query.length);
                        TD.innerHTML = value.replace(match, '<strong>' + match + '</strong>');
                    }
                }
            },
           /* modifyColWidth: function (width, col) {
                // workaround for <strong> text overlapping the dropdown, not really accurate
                var autoWidths = this.getPlugin('autoColumnSize').widths;

                if (autoWidths[col]) {
                    width = autoWidths[col];
                }

                return trimDropdown ? width : width + 15;
            }*/
        });

        // Add additional space for autocomplete holder
       // this.htEditor.view.wt.wtTable.holder.parentNode.style['padding-right'] = Handsontable.Dom.getScrollbarWidth() + 2 + 'px';

        if (skipOne) {
            skipOne = false;
        }

        that.instance._registerTimeout(setTimeout(function () {
            that.queryChoices(that.TEXTAREA.value);
        }, 0));
    };
   
    HIMSTable.prototype.close = function () {
        //console.log(this.htEditor.getActiveEditor());
       // var value = this.htEditor.getInstance().getValue();
        //this.htEditor.getActiveEditor().TEXTAREA.originalValue = "";
        //this.htEditor.TEXTAREA.value = "";
       // console.log(this.TEXTAREA_PARENT.value);

    Handsontable.editors.HandsontableEditor.prototype.close.apply(this, arguments);
};

HIMSTable.prototype.queryChoices = function (query) {
    this.query = query;
   
    if (typeof this.cellProperties.handsontable.data == 'function')
    {
        var that = this;

        this.cellProperties.handsontable.data(query, function (choices) {
            that.updateChoicesList(choices);
        });

    }
    else if (Array.isArray(this.cellProperties.handsontable.data))
    {
        
        var choices;

        if (!query || this.cellProperties.filter === false)
        {
            choices = this.cellProperties.handsontable.data;
        }
        else
        {

            var filteringCaseSensitive = this.cellProperties.filteringCaseSensitive === true;           
            var lowerCaseQuery = query.toLowerCase();
            var filterColumn = this.getFilterColumn();
           // var choiced = this.getFilterColumnData(this.cellProperties.handsontable.data[0]);
            //console.log("choiced: "+choiced);
            choices = this.cellProperties.handsontable.data.filter(function (choice)
            {
                var data = $.map(choice, function (el) { return el });
                choice = data[filterColumn];               
                if (filteringCaseSensitive)
                {
                    return choice.indexOf(query) != -1;
                }
                else
                {
                    return choice.toLowerCase().indexOf(lowerCaseQuery) != -1;
                }

            });
        }

        //console.log("Choices:" + choices);
        this.updateChoicesList(choices);

    }
    else
    {
        console.log("Nothing to update:" + query);
        this.updateChoicesList([]);
    }

};

HIMSTable.prototype.updateChoicesList = function (choices) {
    var pos = Handsontable.Dom.getCaretPosition(this.TEXTAREA),
      endPos = Handsontable.Dom.getSelectionEndPosition(this.TEXTAREA);

    var orderByRelevance = this.sortByRelevance(this.getValue(), choices, this.cellProperties.filteringCaseSensitive);
    var highlightIndex;

    /* jshint ignore:start */
    if (this.cellProperties.filter == false)
    {
        highlightIndex = orderByRelevance[0];
    }
    else
    {
        var sorted = [];
        for (var i = 0, choicesCount = orderByRelevance.length; i < choicesCount; i++) {
            sorted.push(choices[orderByRelevance[i]]);
        }
        highlightIndex = 0;
        choices = sorted;
    }
    /* jshint ignore:end */

    this.choices = choices;

    console.log(choices)   
   // this.htEditor = new Handsontable(this.htContainer, this.htOptions);
    this.htEditor.loadData(choices);

    //this.updateDropdownHeight();

    if (this.cellProperties.strict === true) {
        this.highlightBestMatchingChoice(highlightIndex);
    }

    this.instance.listen();
    this.TEXTAREA.focus();
    Handsontable.Dom.setCaretPosition(this.TEXTAREA, pos, (pos == endPos ? void 0 : endPos));
};


    /**
 * Filters and sorts by relevance
 * @param value
 * @param choices -- For the purpose of HIMStable this is an array of objects
 * @param caseSensitive
 * @returns {Array} array of indexes in original choices array
 * This function has been tweeked a for HIMSTable
 */
HIMSTable.prototype.sortByRelevance = function (value, choices, caseSensitive)
{
    //console.log(this.cellProperties);
    //console.log(this.cellProperties.himstableOptions);
    var choicesRelevance = [],
      currentItem, valueLength = value.length,
      valueIndex, charsLeft, result = [],
      i, choicesCount;

    if (valueLength === 0)
    {      
        for (i = 0, choicesCount = choices.length; i < choicesCount; i++)
        {
            result.push(i);
        }
        return result;
    }   

    for (i = 0, choicesCount = choices.length; i < choicesCount; i++)
    {
        currentItem = Handsontable.helper.stringify(this.getFilterColumnData(choices[i]));

        if (caseSensitive)
        {
            valueIndex = currentItem.indexOf(value);
        }
        else
        {
            valueIndex = currentItem.toLowerCase().indexOf(value.toLowerCase());
        }

        if (valueIndex == -1) {
            continue;
        }
        charsLeft = currentItem.length - valueIndex - valueLength;

        choicesRelevance.push({
            baseIndex: i,
            index: valueIndex,
            charsLeft: charsLeft,
            value: currentItem
        });
    }

    choicesRelevance.sort(function (a, b)
    {

        if (b.index === -1) {
            return -1;
        }
        if (a.index === -1) {
            return 1;
        }

        if (a.index < b.index) {
            return -1;
        } else if (b.index < a.index) {
            return 1;
        } else if (a.index === b.index) {
            if (a.charsLeft < b.charsLeft) {
                return -1;
            } else if (a.charsLeft > b.charsLeft) {
                return 1;
            } else {
                return 0;
            }
        }
    });

    for (i = 0, choicesCount = choicesRelevance.length; i < choicesCount; i++)
    {
        result.push(choicesRelevance[i].baseIndex);
    }

    //console.log(result);
    return result;
};


HIMSTable.prototype.updateDropdownHeight = function () {
    var currentDropdownWidth = this.htEditor.getColWidth(0) + Handsontable.dom.getScrollbarWidth() + 2;
    var trimDropdown = this.cellProperties.trimDropdown === void 0 ? true : this.cellProperties.trimDropdown;

    this.htEditor.updateSettings({
        height: this.getDropdownHeight(),
        width: trimDropdown ? void 0 : currentDropdownWidth
    });

    this.htEditor.view.wt.wtTable.alignOverlaysWithTrimmingContainer();
};

HIMSTable.prototype.getDropdownHeight = function ()
{
    var firstRowHeight = this.htEditor.getInstance().getRowHeight(0) || 23;
    var _visibleRows = this.cellProperties.visibleRows;

    return this.choices.length >= _visibleRows ? _visibleRows * firstRowHeight : this.choices.length * firstRowHeight + 8;
};


HIMSTable.prototype.finishEditing = function (restoreOriginalValue)
{
    if (!restoreOriginalValue)
    {
        this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
        this.instance.removeHook('afterOnCellMouseDown', onafterOnCellMouseDown);
    }
   
    Handsontable.editors.HandsontableEditor.prototype.finishEditing.apply(this, arguments);

    //this.TEXTAREA.value = '';
};

HIMSTable.prototype.highlightBestMatchingChoice = function (index)
{
    console.log(index);
    if (typeof index === 'number')
    {
        this.htEditor.selectCell(index, 0);
    }
    else
    {
        this.htEditor.deselectCell();
    }
};


HIMSTable.prototype.allowKeyEventPropagation = function (keyCode)
{
    var SelectedRow = this.htEditor.getSelectedRange() ? this.htEditor.getSelectedRange().from.row : -1;
   
    var allowed = false;

    if (keyCode === KEY_CODES.ARROW_DOWN && SelectedRow < this.htEditor.countRows() - 1) {
        allowed = true;
    }

  if (keyCode === KEY_CODES.ARROW_UP && SelectedRow > -1)
    {
        allowed = true;
    }

    return allowed;
};

HIMSTable.prototype.getFilterColumnData = function (rowData)
{
    var data = $.map(rowData, function (el) { return el });
    var filterColumn = 0;
    if (this.cellProperties.himstableOptions && this.cellProperties.himstableOptions.filterColumn) {
        filterColumn = this.cellProperties.himstableOptions.filterColumn;
    }

    return data[filterColumn];
};

HIMSTable.prototype.getFilterColumn = function () {
    
    var filterColumn = 0;
    if (this.cellProperties.himstableOptions && this.cellProperties.himstableOptions.filterColumn) {
        filterColumn = this.cellProperties.himstableOptions.filterColumn;
    }

    return filterColumn;
};

	Handsontable.editors.registerEditor('himstable', HIMSTable);  
})(Handsontable);