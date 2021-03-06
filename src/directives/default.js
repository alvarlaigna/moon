/* ======= Default Directives ======= */

specialDirectives[Moon.config.prefix + "if"] = {
  afterGenerate: function(value, meta, code, vnode) {
    return `(${compileTemplate(value, false)}) ? ${code} : null`;
  }
}

specialDirectives[Moon.config.prefix + "show"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode) {
    const runTimeShowDirective = {
      name: Moon.config.prefix + "show",
      value: compileTemplate(value, false),
      literal: true
    }

    if(!vnode.props.directives) {
      vnode.props.directives = [runTimeShowDirective];
    } else {
      vnode.props.directives.push(runTimeShowDirective);
    }
  }
}

specialDirectives[Moon.config.prefix + "for"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode) {
    // Setup Deep Flag to Flatten Array
    parentVNode.deep = true;
  },
  afterGenerate: function(value, meta, code, vnode) {
    // Get Parts
    const parts = value.split(" in ");
    // Aliases
    const aliases = parts[0].split(",");
    // The Iteratable
    const iteratable = compileTemplate(parts[1], false);

    // Get any parameters
    const params = aliases.join(",");

    // Change any references to the parameters in children
    code.replace(new RegExp(`instance\\.get\\("(${aliases.join("|")})"\\)`, 'g'), function(match, alias) {
      code = code.replace(new RegExp(`instance.get\\("${alias}"\\)`, "g"), alias);
    });

    // Use the renderLoop runtime helper
    return `instance.renderLoop(${iteratable}, function(${params}) { return ${code}; })`;
  }
}

specialDirectives[Moon.config.prefix + "on"] = {
  beforeGenerate: function(value, meta, vnode) {

    // Extract modifiers and the event
    let rawModifiers = meta.arg.split(".");
    const eventToCall = rawModifiers[0];
    let params = "event";
    let methodToCall = compileTemplate(value, false);
    const rawParams = methodToCall.split("(");

    if(rawParams.length > 1) {
      methodToCall = rawParams.shift();
      params = rawParams.join("(").slice(0, -1);
    }
    var modifiers = "";

    rawModifiers.shift();

    for(var i = 0; i < rawModifiers.length; i++) {
      modifiers += eventModifiersCode[rawModifiers[i]];
    }

    var code = `function(event) {${modifiers}instance.callMethod("${methodToCall}", [${params}])}`;
    if(!vnode.meta.eventListeners[eventToCall]) {
      vnode.meta.eventListeners[eventToCall] = [code]
    } else {
      vnode.meta.eventListeners[eventToCall].push(code);
    }
  }
}

specialDirectives[Moon.config.prefix + "model"] = {
  beforeGenerate: function(value, meta, vnode) {
    // Compile a string value for the keypath
    const compiledStringValue = compileTemplate(value, true);
    // Setup default event types and dom property to change
    let eventType = "input";
    let valueProp = "value";

    // If input type is checkbox, listen on 'change' and change the 'checked' dom property
    if(vnode.props.attrs.type && vnode.props.attrs.type.value === "checkbox") {
      eventType = "change";
      valueProp = "checked";
    }

    // Generate event listener code
    const code = `function(event) {instance.set("${compiledStringValue}", event.target.${valueProp})}`;

    // Push the listener to it's event listeners
    if(!vnode.meta.eventListeners[eventType]) {
      vnode.meta.eventListeners[eventType] = [code]
    } else {
      vnode.meta.eventListeners[eventType].push(code);
    }

    // Setup a query used to get the value, and set the corresponding dom property
    const getQuery = compileTemplate(`{{${compileTemplate(value, false)}}}`, false);
    if(!vnode.props.dom) {
      vnode.props.dom = {};
    }
    vnode.props.dom[valueProp] = getQuery;
  }
};

specialDirectives[Moon.config.prefix + "literal"] = {
  duringPropGenerate: function(value, meta, vnode) {
    const prop = meta.arg;
    // make sure object is treated correctly during code generation
    vnode.props.attrs[prop] = {
      value: true,
      meta: {}
    };

    if(prop === "class") {
      // Classes need to be rendered differently
      return `"class": instance.renderClass(${compileTemplate(value, false)}), `;
    }
    return `"${prop}": ${compileTemplate(value, false)}, `;
  }
};

specialDirectives[Moon.config.prefix + "html"] = {
  beforeGenerate: function(value, meta, vnode) {
    if(!vnode.props.dom) {
      vnode.props.dom = {};
    }
    vnode.props.dom.innerHTML = `"${compileTemplate(value, true)}"`;
  }
}

directives[Moon.config.prefix + "show"] = function(el, val, vnode) {
  el.style.display = (val ? '' : 'none');
}

directives[Moon.config.prefix + "mask"] = function(el, val, vnode) {

}
