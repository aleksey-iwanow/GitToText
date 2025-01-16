$(function(){
    $("form").submit(function(event) {
        event.preventDefault();
        if (!check_input("#url_input") || $('#load_panel').is(":visible")) return;
        $('#load_panel').show();
        $.ajax({    
            url: $("form").attr('action'),
            data: $("form").serialize(),
            type: 'post',
            success: function(data){
                $('#info').show();
                $('#load_panel').hide();
                $('#tree').text(data.structure.tree);
                $('#infoRepo').text(data.structure.info);
                $('#files_content').text(data.structure.content);
            }
        });
    });                               
});

function check_input(field){
    if ($(field).val() == "") return false;
    return true;
}

function set_input(val){
    $("#url_input").val(val);
}

function copy(textarea, btn){
    navigator.clipboard.writeText($(textarea).text())
    $(btn).text("✔ скопированно")
}

$(document).on('click', function() { 
    $('.copy_btn').text("копировать"); 
});

