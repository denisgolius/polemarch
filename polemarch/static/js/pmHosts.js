
var pmHosts = inheritance(pmItems)

pmHosts.model.name = "hosts"
pmHosts.model.page_name = "host"

pmHosts.copyItem = function(item_id)
{
    var def = new $.Deferred();
    var thisObj = this;

    $.when(this.loadItem(item_id)).done(function()
    {
        var data = thisObj.model.items[item_id];
        delete data.id;
        spajs.ajax.Call({
            url: "/api/v1/"+thisObj.model.name+"/",
            type: "POST",
            contentType:'application/json',
            data: JSON.stringify(data),
                        success: function(data)
            {
                thisObj.model.items[data.id] = data
                def.resolve(data.id)
            },
            error:function(e)
            {
                def.reject(e)
            }
        });
    }).fail(function(e)
    {
        def.reject(e)
    })


    return def.promise();
} 

/**
 * @return $.Deferred
 */
pmHosts.addItem = function(parent_type, parent_item)
{
    var def = new $.Deferred();

    var data = {}

    data.name = $("#new_host_name").val()
    data.type = $("#new_host_type").val()
    data.vars = jsonEditor.jsonEditorGetValues()

    if(data.type == "HOST"  && (!data.name || !this.validateHostName(data.name)))
    {
        $.notify("Invalid value in field name", "error");
        return;
    }
    else if(data.type == "RANGE"  && (!data.name || !this.validateRangeName(data.name)))
    {
        $.notify("Invalid value in field name", "error");
        return;
    }

    spajs.ajax.Call({
        url: "/api/v1/"+this.model.name+"/",
        type: "POST",
        contentType:'application/json',
        data: JSON.stringify(data),
                success: function(data)
        { 
            $.notify("Host created", "success");

            if(parent_item)
            {
                if(parent_type == 'group')
                {
                    $.when(pmGroups.addSubHosts(parent_item, [data.id])).always(function(){
                        $.when(spajs.open({ menuId:"group/"+parent_item})).always(function(){
                            def.resolve()
                        })
                    })
                }
                else if(parent_type == 'inventory')
                {
                    $.when(pmInventories.addSubHosts(parent_item, [data.id])).always(function(){
                        $.when(spajs.open({ menuId:"inventory/"+parent_item})).always(function(){
                            def.resolve()
                        })
                    })
                }
                else if(parent_type == 'project')
                {
                    $.when(pmProjects.addSubHosts(parent_item, [data.id])).always(function(){
                        $.when(spajs.open({ menuId:"project/"+parent_item})).always(function(){
                            def.resolve()
                        })
                    })
                }
                else
                {
                    console.error("Не известный parent_type", parent_type)
                    $.when(spajs.open({ menuId:"host/"+data.id})).always(function(){
                        def.resolve()
                    })
                }
            }
            else
            {
                $.when(spajs.open({ menuId:"host/"+data.id})).always(function(){
                    def.resolve()
                })
            }

        },
        error:function(e)
        {
            polemarch.showErrors(e.responseJSON)
            def.reject()
        }
    });
    return def.promise();
}

/**
 * @return $.Deferred
 */
pmHosts.updateItem = function(item_id)
{
    var data = {}

    data.name = $("#host_"+item_id+"_name").val()
    data.type = $("#host_"+item_id+"_type").val()
    data.vars = jsonEditor.jsonEditorGetValues()

    // @todo Добавить валидацию диапазонов "127.0.1.[5:6]" и 127.0.1.1, 127.0.1.2
    if(data.type == 'HOST')
    {
        if(!data.name || !this.validateHostName(data.name) )
        {
            $.notify("Invalid value in field name", "error");
            return;
        }
    }
    else
    {  
        if(!data.name || !this.validateRangeName(data.name) )
        {
            $.notify("Invalid value in field name", "error");
            return;
        }
    }

    var thisObj = this;
    return spajs.ajax.Call({
        url: "/api/v1/"+this.model.name+"/"+item_id+"/",
        type: "PATCH",
        contentType:'application/json',
        data:JSON.stringify(data),
        success: function(data)
        { 
            thisObj.model.items[item_id] = data
            $.notify("Save", "success");
        },
        error:function(e)
        {
            polemarch.showErrors(e.responseJSON)
        }
    });
}

/*
 * 
detail:"database is locked"
error_type:"OperationalError"
 * 
for(var i =0; i< 10000; i++)
{
setTimeout(function(){
    name = Math.random()+"-"+Math.random()
    name = name.replace(/\./g, "")
    spajs.ajax.Call({
            url: "/api/v1/hosts/",
            type: "POST",
            contentType:'application/json',
            data: JSON.stringify({name:name, type:"HOST"}),
                })
}, i*400);
}
 */ 