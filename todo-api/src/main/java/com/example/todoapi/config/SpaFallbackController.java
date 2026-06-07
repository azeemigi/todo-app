package com.example.todoapi.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaFallbackController {

    @GetMapping(value = "/{path:[^.]*}")
    public String forward() {
        return "forward:/index.html";
    }
}
