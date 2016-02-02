# himstable
Himstable is an enhanced editor type in handontable just like autocomplete,date,etc

To use a column in handsontable  as a himstable pls check sample below:

var autoData = [
                { Name: 'Yaw Kyei', Code: 'aeeew', isActive: 'Yes' },
                { Name: 'Kwame Asare', Code: 'aeeew', isActive: 'Yes' }, 
                { Name: 'Boga 10 Pounds', Code: 'aeeew', isActive: 'Yes' }
              ];
    
                {
                    editor: 'himstable',                   
                    allowInvalid: false,
                    handsontable: {
                        colHeaders: ['Name', 'Code', 'isActive'],
                        data: autoData,
                        colWidths: 150
                    },
                    himstableOptions: {
                        filterColumn: 0, //The zero index column that is used to filter the data on the table
                        keyColomn: 1 // the zero index column that is returned when you select a row
                    }
                                       
                }
