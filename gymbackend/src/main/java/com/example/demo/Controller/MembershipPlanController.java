package com.example.demo.Controller;

import com.example.demo.Entity.MembershipPlan;
import com.example.demo.Service.MembershipPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membership-plans")
public class MembershipPlanController {

    private final MembershipPlanService membershipPlanService;

    public MembershipPlanController(MembershipPlanService membershipPlanService) {
        this.membershipPlanService = membershipPlanService;
    }

    @GetMapping
    public List<MembershipPlan> getAllPlans() {
        return membershipPlanService.getAllPlans();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MembershipPlan> getPlanById(@PathVariable Long id) {

        return membershipPlanService.getPlanById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MembershipPlan> createPlan(
            @RequestBody MembershipPlan plan) {

        MembershipPlan savedPlan =
                membershipPlanService.createPlan(plan);

        return ResponseEntity.ok(savedPlan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MembershipPlan> updatePlan(
            @PathVariable Long id,
            @RequestBody MembershipPlan plan) {

        MembershipPlan updatedPlan =
                membershipPlanService.updatePlan(id, plan);

        return ResponseEntity.ok(updatedPlan);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {

        membershipPlanService.deletePlan(id);

        return ResponseEntity.noContent().build();
    }
}